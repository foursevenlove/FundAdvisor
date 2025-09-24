"""
策略相关 API 端点
"""
import logging

from fastapi import APIRouter, HTTPException, Body
from typing import Dict, List, Any
from pydantic import BaseModel

from ....strategies import strategy_manager
from ....schemas import APIResponse
from ....services.data_service import data_service

router = APIRouter()
logger = logging.getLogger(__name__)


class StrategyApplyRequest(BaseModel):
    fund_code: str
    strategy_name: str


@router.post("/apply", response_model=Dict[str, str])
async def apply_strategy(request: StrategyApplyRequest = Body(...)):
    """
    应用投资策略分析单个基金

    - **fund_code**: 基金代码
    - **strategy_name**: 策略名称
    """
    try:
        # 1. 获取基金数据
        historical_data = await data_service.get_fund_historical_data(request.fund_code)
        if historical_data.empty:
            raise HTTPException(status_code=404, detail=f"无法获取基金 {request.fund_code} 的历史数据")

        # 2. 加载策略
        strategy = strategy_manager.get_strategy(request.strategy_name)
        if not strategy:
            raise HTTPException(status_code=404, detail=f"策略 '{request.strategy_name}' 不存在")

        # 3. 执行策略分析
        signal, reason = strategy.analyze(historical_data)

        # 4. 返回结果
        return {"signal": signal, "reason": reason}
    except HTTPException as exc:
        logger.error(
            "HTTPException in apply_strategy: status=%s detail=%s",
            exc.status_code,
            exc.detail,
            exc_info=True,
        )
        raise
    except Exception as e:
        logger.exception(
            "Unexpected error in apply_strategy for fund=%s strategy=%s",
            request.fund_code,
            request.strategy_name,
        )
        raise HTTPException(status_code=500, detail=f"策略应用失败: {str(e)}")


@router.get("/", response_model=Dict[str, Any])
async def get_all_strategies():
    """
    获取所有可用策略列表
    """
    try:
        strategies = strategy_manager.get_strategy_descriptions()
        return {
            "strategies": strategies,
            "total_count": len(strategies),
            "available_strategies": list(strategies.keys())
        }
    except Exception as e:
        logger.exception("获取策略列表失败")
        raise HTTPException(status_code=500, detail=f"获取策略列表失败: {str(e)}")


@router.get("/{strategy_name}", response_model=Dict[str, Any])
async def get_strategy_info(strategy_name: str):
    """
    获取指定策略的详细信息
    
    - **strategy_name**: 策略名称
    """
    try:
        strategy = strategy_manager.get_strategy(strategy_name)
        if not strategy:
            raise HTTPException(status_code=404, detail="策略不存在")
        
        description = strategy.get_strategy_description()
        return {
            "strategy_info": description,
            "strategy_name": strategy_name,
            "is_available": True
        }
    except HTTPException as exc:
        logger.error(
            "HTTPException in get_strategy_info: %s status=%s detail=%s",
            strategy_name,
            exc.status_code,
            exc.detail,
            exc_info=True,
        )
        raise
    except Exception as e:
        logger.exception("获取策略信息失败: %s", strategy_name)
        raise HTTPException(status_code=500, detail=f"获取策略信息失败: {str(e)}")


@router.get("/{strategy_name}/config", response_model=Dict[str, Any])
async def get_strategy_config(strategy_name: str):
    """
    获取策略配置参数
    
    - **strategy_name**: 策略名称
    """
    try:
        strategy = strategy_manager.get_strategy(strategy_name)
        if not strategy:
            raise HTTPException(status_code=404, detail="策略不存在")
        
        return {
            "strategy_name": strategy_name,
            "config": strategy.config,
            "description": strategy.get_strategy_description()
        }
    except HTTPException as exc:
        logger.error(
            "HTTPException in get_strategy_config: %s status=%s detail=%s",
            strategy_name,
            exc.status_code,
            exc.detail,
            exc_info=True,
        )
        raise
    except Exception as e:
        logger.exception("获取策略配置失败: %s", strategy_name)
        raise HTTPException(status_code=500, detail=f"获取策略配置失败: {str(e)}")


@router.put("/{strategy_name}/config", response_model=APIResponse)
async def update_strategy_config(strategy_name: str, config: Dict[str, Any]):
    """
    更新策略配置参数
    
    - **strategy_name**: 策略名称
    - **config**: 新的配置参数
    """
    try:
        success = strategy_manager.update_strategy_config(strategy_name, config)
        if not success:
            raise HTTPException(status_code=404, detail="策略不存在")
        
        return APIResponse(
            success=True,
            message=f"策略 {strategy_name} 配置更新成功",
            data={"strategy_name": strategy_name, "new_config": config}
        )
    except HTTPException as exc:
        logger.error(
            "HTTPException in update_strategy_config: %s status=%s detail=%s",
            strategy_name,
            exc.status_code,
            exc.detail,
            exc_info=True,
        )
        raise
    except Exception as e:
        logger.exception("更新策略配置失败: %s", strategy_name)
        raise HTTPException(status_code=500, detail=f"更新策略配置失败: {str(e)}")


@router.get("/categories/technical-indicators", response_model=Dict[str, Any])
async def get_technical_indicators_info():
    """
    获取技术指标说明
    """
    try:
        indicators_info = {
            "moving_averages": {
                "name": "移动平均线",
                "description": "计算指定周期内价格的平均值，用于判断趋势方向",
                "types": {
                    "SMA": "简单移动平均线",
                    "EMA": "指数移动平均线"
                },
                "common_periods": [5, 10, 20, 30, 60, 120, 250]
            },
            "rsi": {
                "name": "相对强弱指数",
                "description": "衡量价格变动速度和变化的动量指标",
                "range": "0-100",
                "oversold": "通常 < 30",
                "overbought": "通常 > 70",
                "common_period": 14
            },
            "macd": {
                "name": "平滑异同移动平均线",
                "description": "由快线、慢线和信号线组成的趋势跟踪指标",
                "components": {
                    "macd_line": "快线 - 慢线",
                    "signal_line": "MACD线的EMA",
                    "histogram": "MACD线 - 信号线"
                },
                "common_params": {
                    "fast": 12,
                    "slow": 26,
                    "signal": 9
                }
            },
            "bollinger_bands": {
                "name": "布林带",
                "description": "由中轨（移动平均线）和上下轨（标准差）组成的波动率指标",
                "components": {
                    "upper_band": "中轨 + N倍标准差",
                    "middle_band": "移动平均线",
                    "lower_band": "中轨 - N倍标准差"
                },
                "common_params": {
                    "period": 20,
                    "std_dev": 2
                }
            }
        }
        
        return {
            "technical_indicators": indicators_info,
            "total_indicators": len(indicators_info)
        }
    except Exception as e:
        logger.exception("获取技术指标信息失败")
        raise HTTPException(status_code=500, detail=f"获取技术指标信息失败: {str(e)}")


@router.get("/performance/backtest-info", response_model=Dict[str, Any])
async def get_backtest_info():
    """
    获取回测相关信息
    """
    try:
        backtest_info = {
            "description": "策略回测功能说明",
            "metrics": {
                "total_return": "总收益率",
                "annual_return": "年化收益率",
                "max_drawdown": "最大回撤",
                "sharpe_ratio": "夏普比率",
                "win_rate": "胜率",
                "profit_loss_ratio": "盈亏比"
            },
            "time_periods": {
                "1M": "1个月",
                "3M": "3个月",
                "6M": "6个月",
                "1Y": "1年",
                "2Y": "2年",
                "3Y": "3年",
                "5Y": "5年",
                "ALL": "全部历史"
            },
            "benchmark_options": [
                "沪深300指数",
                "中证500指数",
                "创业板指数",
                "上证指数",
                "深证成指"
            ],
            "note": "回测结果仅供参考，不构成投资建议"
        }
        
        return {
            "backtest_info": backtest_info,
            "available": True,
            "note": "回测功能正在开发中，敬请期待"
        }
    except Exception as e:
        logger.exception("获取回测信息失败")
        raise HTTPException(status_code=500, detail=f"获取回测信息失败: {str(e)}")


@router.get("/risk-management/info", response_model=Dict[str, Any])
async def get_risk_management_info():
    """
    获取风险管理相关信息
    """
    try:
        risk_info = {
            "position_sizing": {
                "name": "仓位管理",
                "description": "根据风险承受能力确定投资仓位大小",
                "methods": {
                    "fixed_amount": "固定金额",
                    "fixed_percentage": "固定比例",
                    "kelly_criterion": "凯利公式",
                    "volatility_based": "基于波动率"
                }
            },
            "stop_loss": {
                "name": "止损策略",
                "description": "设定损失限额，控制下行风险",
                "types": {
                    "fixed_percentage": "固定百分比止损",
                    "trailing_stop": "移动止损",
                    "technical_stop": "技术指标止损"
                }
            },
            "diversification": {
                "name": "分散投资",
                "description": "通过投资不同类型的基金降低整体风险",
                "principles": [
                    "不要把所有鸡蛋放在一个篮子里",
                    "关注相关性，避免过度集中",
                    "定期再平衡投资组合"
                ]
            },
            "risk_metrics": {
                "volatility": "波动率 - 衡量价格波动程度",
                "beta": "贝塔系数 - 相对市场的敏感度",
                "var": "风险价值 - 在一定置信水平下的最大损失",
                "max_drawdown": "最大回撤 - 历史最大跌幅"
            }
        }
        
        return {
            "risk_management": risk_info,
            "importance": "风险管理是投资成功的关键因素",
            "recommendation": "建议投资者根据自身风险承受能力制定合适的风险管理策略"
        }
    except Exception as e:
        logger.exception("获取风险管理信息失败")
        raise HTTPException(status_code=500, detail=f"获取风险管理信息失败: {str(e)}")
