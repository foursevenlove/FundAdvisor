"""
基金相关 API 端点
"""
import logging
import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
from datetime import datetime, timedelta

from ....core.database import get_db
from ....services.data_service import data_service
from ....strategies import strategy_manager
from ....models import Fund, FundNetValue
from ....schemas import (
    FundSearchRequest, FundSearchResult, FundRealtimeData,
    StrategyAnalysisRequest, StrategyAnalysisResponse, StrategySignalResponse,
    FundDetailResponse, FundInfo, FundNetValue as FundNetValueSchema,
    APIResponse
)

router = APIRouter()


# 工具函数：将策略指标转换为原生类型，防止Pydantic序列化报错
def _sanitize_value(value):
    """递归地将 NumPy/pandas 标量转换为 Python 内置类型"""
    if isinstance(value, dict):
        return {key: _sanitize_value(val) for key, val in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_sanitize_value(item) for item in value]
    if hasattr(value, 'item'):
        try:
            return value.item()
        except Exception:  # pragma: no cover - 防御性处理
            pass
    return value


def _build_strategy_response(signal):
    """将策略信号转换为API响应模型，同时清理指标值"""
    return StrategySignalResponse(
        signal_type=signal.signal_type,
        strength=float(signal.strength),
        reason=signal.reason,
        indicators=_sanitize_value(getattr(signal, 'indicators', {})),
        timestamp=signal.timestamp
    )


@router.get("/search", response_model=List[FundSearchResult])
async def search_funds(
    q: str = Query(..., description="搜索关键词（基金代码或名称）"),
    limit: int = Query(20, ge=1, le=100, description="返回结果数量限制")
):
    """
    搜索基金
    
    - **q**: 搜索关键词（基金代码或名称）
    - **limit**: 返回结果数量限制
    """
    try:
        results = data_service.search_funds(q, limit)
        return [FundSearchResult(**result) for result in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索基金失败: {str(e)}")


@router.get("/{fund_code}/info", response_model=FundInfo)
async def get_fund_info(fund_code: str, db: Session = Depends(get_db)):
    """
    获取基金基本信息
    
    - **fund_code**: 基金代码
    """
    try:
        # 先从数据库查询
        fund = db.query(Fund).filter(Fund.code == fund_code).first()
        
        if not fund:
            # 从数据源获取信息
            fund_info = data_service.get_fund_info(fund_code)
            if not fund_info:
                raise HTTPException(status_code=404, detail="基金不存在")
            
            # 保存到数据库
            fund = Fund(**fund_info)
            db.add(fund)
            db.commit()
            db.refresh(fund)
        
        return FundInfo.model_validate(fund)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取基金信息失败: {str(e)}")


@router.get("/{fund_code}/realtime", response_model=FundRealtimeData)
async def get_fund_realtime_data(fund_code: str):
    """
    获取基金实时数据
    
    - **fund_code**: 基金代码
    """
    try:
        realtime_data = data_service.get_fund_realtime_data(fund_code)
        if not realtime_data:
            raise HTTPException(status_code=404, detail="无法获取实时数据")
        
        return FundRealtimeData(**realtime_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取实时数据失败: {str(e)}")


@router.get("/{fund_code}/net-values", response_model=List[FundNetValueSchema])
async def get_fund_net_values(
    fund_code: str,
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    获取基金净值历史数据

    - **fund_code**: 基金代码
    - **start_date**: 开始日期
    - **end_date**: 结束日期
    """
    try:
        # 确保基金存在
        fund = db.query(Fund).filter(Fund.code == fund_code).first()
        if not fund:
            # 尝试更新基金数据
            success = data_service.update_fund_data(db, fund_code)
            if not success:
                # 如果无法从数据源获取，创建基础记录
                fund = Fund(
                    code=fund_code,
                    name="",
                    fund_type="",
                    manager="",
                    company=""
                )
                db.add(fund)
                db.commit()
                db.refresh(fund)
            else:
                fund = db.query(Fund).filter(Fund.code == fund_code).first()

        # 构建查询
        query = db.query(FundNetValue).filter(FundNetValue.fund_id == fund.id)

        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(FundNetValue.date >= start_dt)

        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(FundNetValue.date <= end_dt)

        net_values = query.order_by(FundNetValue.date.asc()).limit(1000).all()

        if not net_values:
            # 生成模拟净值数据
            mock_data = []

            # 设置日期范围
            if end_date:
                end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            else:
                end_dt = datetime.now()

            if start_date:
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            else:
                start_dt = end_dt - timedelta(days=365)

            # 生成模拟数据
            base_value = 1.4523
            current_date = start_dt

            while current_date <= end_dt:
                if current_date.weekday() < 5:  # 工作日
                    # 生成随机波动
                    change_pct = (random.random() - 0.5) * 0.04  # ±2%
                    base_value *= (1 + change_pct)

                    mock_data.append(FundNetValueSchema(
                        date=current_date.strftime('%Y-%m-%d'),
                        unit_nav=round(base_value, 4),
                        accumulated_nav=round(base_value, 4),
                        daily_return=round(change_pct * 100, 2)
                    ))

                current_date += timedelta(days=1)

            # 按日期倒序返回（最新的在前）
            mock_data.reverse()
            return mock_data

        return [
            FundNetValueSchema(
                date=nv.date.strftime('%Y-%m-%d'),
                unit_nav=nv.net_value,
                accumulated_nav=nv.accumulated_value,
                daily_return=nv.daily_return
            )
            for nv in net_values
        ]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取净值数据失败: {str(e)}")


@router.post("/{fund_code}/strategy-analysis", response_model=StrategyAnalysisResponse)
async def analyze_fund_strategy(
    fund_code: str,
    request: StrategyAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    分析基金投资策略
    
    - **fund_code**: 基金代码
    - **strategy_name**: 策略名称，为空则分析所有策略
    - **start_date**: 开始日期
    - **end_date**: 结束日期
    """
    try:
        # 获取基金信息
        fund = db.query(Fund).filter(Fund.code == fund_code).first()
        if not fund:
            # 尝试更新基金数据
            success = data_service.update_fund_data(db, fund_code)
            if not success:
                raise HTTPException(status_code=404, detail="基金不存在")
            fund = db.query(Fund).filter(Fund.code == fund_code).first()
        
        # 获取净值数据
        query = db.query(FundNetValue).filter(FundNetValue.fund_id == fund.id)
        
        if request.start_date:
            start_dt = datetime.strptime(request.start_date, '%Y-%m-%d')
            query = query.filter(FundNetValue.date >= start_dt)
        
        if request.end_date:
            end_dt = datetime.strptime(request.end_date, '%Y-%m-%d')
            query = query.filter(FundNetValue.date <= end_dt)
        
        net_values = query.order_by(FundNetValue.date).all()
        
        if not net_values:
            raise HTTPException(status_code=400, detail="没有足够的净值数据进行分析")
        
        # 转换为 DataFrame
        data = pd.DataFrame([
            {
                'date': nv.date,
                'net_value': nv.net_value,
                'daily_return': nv.daily_return or 0,
                'volume': nv.volume or 0
            }
            for nv in net_values
        ])
        
        # 策略分析
        signals = {}
        
        if request.strategy_name:
            # 分析指定策略
            signal = strategy_manager.calculate_signal(request.strategy_name, data)
            if signal:
                signals[request.strategy_name] = _build_strategy_response(signal)
        else:
            # 分析所有策略
            all_signals = strategy_manager.calculate_all_signals(data)
            for name, signal in all_signals.items():
                signals[name] = _build_strategy_response(signal)
        
        # 获取综合信号
        consensus_signal = None
        if len(signals) > 1:
            consensus = strategy_manager.get_consensus_signal(data)
            consensus_signal = StrategySignalResponse(
                signal_type=consensus.signal_type,
                strength=float(consensus.strength),
                reason=consensus.reason,
                indicators=_sanitize_value(consensus.indicators),
                timestamp=consensus.timestamp
            )
        
        return StrategyAnalysisResponse(
            fund_code=fund_code,
            fund_name=fund.name,
            analysis_date=datetime.now(),
            signals=signals,
            consensus_signal=consensus_signal
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"策略分析失败: {str(e)}")


@router.get("/{fund_code}/detail", response_model=FundDetailResponse)
async def get_fund_detail(
    fund_code: str,
    days: int = Query(365, ge=30, le=1095, description="获取多少天的数据"),
    db: Session = Depends(get_db)
):
    """
    获取基金详细信息（包含基本信息、实时数据、净值数据和策略分析）

    - **fund_code**: 基金代码
    - **days**: 获取多少天的历史数据
    """
    try:
        # 获取基金基本信息
        fund = db.query(Fund).filter(Fund.code == fund_code).first()

        fund_info = None

        placeholder_name = f"基金{fund_code}"
        if not fund or not fund.name or fund.name == placeholder_name:
            # 如果基金不存在或者数据为空，尝试更新数据
            success = data_service.update_fund_data(db, fund_code)
            if success:
                fund = db.query(Fund).filter(Fund.code == fund_code).first()

        if fund and fund.name:
            # 如果有真实数据，使用真实数据并填充缺失字段
            fund_info = FundInfo.model_validate(fund)
            logging.info("fund_info: %s", fund_info)
            fund_info.manager = fund_info.manager or "未知基金经理"
            fund_info.company = fund_info.company or "未知基金公司"
            fund_info.description = fund_info.description or "暂无描述信息"
        else:
            # 使用模拟数据
            fund_info = FundInfo(
                id=fund.id if fund else 0,
                code=fund_code,
                name=f"易方达科技创新混合{fund_code[-2:]}号",
                fund_type="混合型-偏股",
                manager="刘武、冯波",
                company="易方达基金管理有限公司",
                establish_date="2020-03-18",
                scale=8500000000,  # 85亿
                current_nav=1.4523,
                accumulated_nav=1.4523,
                daily_return=1.24,
                created_at=fund.created_at if fund else None,
                updated_at=fund.updated_at if fund else None,
                description="本基金主要投资于科技创新相关的股票，在严格控制风险的前提下，追求超额收益和长期资本增值。"
            )

        # 获取实时数据
        realtime_data = None
        try:
            rt_data = data_service.get_fund_realtime_data(fund_code)
            if rt_data:
                realtime_data = FundRealtimeData(**rt_data)
        except:
            pass  # 实时数据获取失败不影响其他数据

        # 获取净值数据
        start_date = datetime.now() - timedelta(days=days)

        if fund:
            net_values_query = db.query(FundNetValue).filter(
                FundNetValue.fund_id == fund.id,
                FundNetValue.date >= start_date
            ).order_by(FundNetValue.date)

            net_values = net_values_query.all()
        else:
            net_values = []

        if not net_values:
            # 生成模拟净值数据
            mock_nav_data = []
            base_value = 1.4523
            base_date = datetime.now() - timedelta(days=days)

            for i in range(days):
                current_date = base_date + timedelta(days=i)
                if current_date.weekday() < 5:  # 只在工作日
                    # 生成随机波动
                    change_pct = (random.random() - 0.5) * 0.04  # ±2%
                    base_value *= (1 + change_pct)

                    mock_nav_data.append(FundNetValueSchema(
                        date=current_date.strftime('%Y-%m-%d'),
                        unit_nav=round(base_value, 4),
                        accumulated_nav=round(base_value, 4),
                        daily_return=round(change_pct * 100, 2)
                    ))

            net_values_list = mock_nav_data
        else:
            net_values_list = [
                FundNetValueSchema(
                    date=nv.date.strftime('%Y-%m-%d'),
                    unit_nav=nv.net_value,
                    accumulated_nav=nv.accumulated_value,
                    daily_return=nv.daily_return
                )
                for nv in net_values
            ]

        # 策略分析
        strategy_signals = {}
        consensus_signal = None

        if net_values_list and len(net_values_list) > 10:
            data = pd.DataFrame([
                {
                    'date': nv.date,
                    'unit_nav': nv.unit_nav,
                    'net_value': nv.unit_nav,
                    'daily_return': nv.daily_return or 0,
                    'volume': 1000000  # 模拟成交量
                }
                for nv in net_values_list
            ])

            try:
                all_signals = strategy_manager.calculate_all_signals(data)
                for name, signal in all_signals.items():
                    strategy_signals[name] = _build_strategy_response(signal)

                # 获取综合信号
                if len(strategy_signals) > 1:
                    consensus = strategy_manager.get_consensus_signal(data)
                    consensus_signal = StrategySignalResponse(
                signal_type=consensus.signal_type,
                strength=float(consensus.strength),
                reason=consensus.reason,
                indicators=_sanitize_value(consensus.indicators),
                timestamp=consensus.timestamp
            )
            except:
                pass  # 策略分析失败不影响其他数据

        return FundDetailResponse(
            fund_info=fund_info,
            realtime_data=realtime_data,
            net_values=net_values_list,
            strategy_signals=strategy_signals,
            consensus_signal=consensus_signal
        )

    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"获取基金详情失败: fund_code={fund_code}")
        raise HTTPException(status_code=500, detail=f"获取基金详情失败: {str(e)}")


@router.post("/{fund_code}/update-data", response_model=APIResponse)
async def update_fund_data(fund_code: str, db: Session = Depends(get_db)):
    """
    更新基金数据
    
    - **fund_code**: 基金代码
    """
    try:
        success = data_service.update_fund_data(db, fund_code)
        if not success:
            raise HTTPException(status_code=400, detail="更新基金数据失败")
        
        return APIResponse(
            success=True,
            message=f"基金 {fund_code} 数据更新成功"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新数据失败: {str(e)}")