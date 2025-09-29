"""
关注列表相关 API 端点
"""
import traceback
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
import logging
from sqlalchemy.orm import Session
from typing import List

from ....core.database import get_db
from ....models import WatchList, Fund
from ....schemas import WatchListRequest, WatchListResponse, APIResponse
from ....services.data_service import data_service

router = APIRouter()

# 配置日志
logger = logging.getLogger(__name__)


@router.get("", response_model=List[WatchListResponse])
async def get_watchlist(
    db: Session = Depends(get_db)
):
    """
    获取用户关注列表
    """
    try:
        watchlist_items = (
            db.query(WatchList)
            .join(Fund, WatchList.fund_id == Fund.id)
            .all()
        )

        result = []
        for item in watchlist_items:
            fund = item.fund
            result.append(WatchListResponse(
                id=str(item.id),
                fund_id=str(fund.id),
                fund_code=fund.code,
                fund_name=fund.name,
                fund_type=fund.fund_type or '',
                manager=fund.manager or '',
                company=fund.company or '',
                created_at=item.created_at.isoformat()
            ))
        return result
    except Exception as e:
        error_msg = f"获取关注列表失败: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())  # 打印堆栈信息
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("", response_model=APIResponse)
async def add_to_watchlist(
    request: WatchListRequest,
    db: Session = Depends(get_db)
):
    """
    添加基金到关注列表
    """
    try:
        # 检查基金是否存在；不存在则尝试拉取并创建
        fund = db.query(Fund).filter(Fund.code == request.fund_code).first()
        if not fund:
            # 从数据源获取基金基本信息并落库（轻量，不强制拉取净值）
            fund_info = data_service.get_fund_info(request.fund_code)
            if not fund_info:
                raise HTTPException(status_code=404, detail="基金不存在")

            # 解析成立日期
            establish_date_value = fund_info.get("establish_date")
            if establish_date_value == "":
                establish_date_value = None
            if isinstance(establish_date_value, str) and establish_date_value:
                for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d"):
                    try:
                        establish_date_value = datetime.strptime(
                            establish_date_value, fmt
                        )
                        break
                    except ValueError:
                        continue
                else:
                    establish_date_value = None

            # 创建基金记录
            try:
                fund = Fund(
                    code=fund_info.get("code", request.fund_code),
                    name=fund_info.get("name", request.fund_code),
                    fund_type=fund_info.get("fund_type"),
                    manager=fund_info.get("manager"),
                    company=fund_info.get("company"),
                    establish_date=establish_date_value,
                    scale=fund_info.get("scale"),
                    current_nav=fund_info.get("current_nav"),
                    accumulated_nav=fund_info.get("accumulated_nav"),
                    daily_return=fund_info.get("daily_return"),
                    description=fund_info.get("description", ""),
                )
                db.add(fund)
                db.commit()
                db.refresh(fund)
            except Exception:
                # 可能存在并发或唯一约束冲突，回滚后重查
                db.rollback()
                fund = db.query(Fund).filter(Fund.code == request.fund_code).first()
                if not fund:
                    raise

        # 检查是否已经关注
        existing = db.query(WatchList).filter(
            WatchList.fund_id == fund.id
        ).first()

        if existing:
            return APIResponse(
                success=True,
                message=f"基金 {fund.name} 已在关注列表中"
            )

        # 添加到关注列表
        watchlist_item = WatchList(
            fund_id=fund.id
        )

        db.add(watchlist_item)
        db.commit()

        return APIResponse(
            success=True,
            message=f"已添加 {fund.name} 到关注列表"
        )
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"添加到关注列表失败: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())  # 打印堆栈信息
        raise HTTPException(status_code=500, detail=error_msg)


@router.delete("/{fund_code}", response_model=APIResponse)
async def remove_from_watchlist(
    fund_code: str,
    db: Session = Depends(get_db)
):
    """
    从关注列表中移除基金
    """
    try:
        # 查找基金
        fund = db.query(Fund).filter(Fund.code == fund_code).first()
        if not fund:
            raise HTTPException(status_code=404, detail="基金不存在")

        # 查找关注项
        watchlist_item = db.query(WatchList).filter(
            WatchList.fund_id == fund.id
        ).first()

        if not watchlist_item:
            raise HTTPException(status_code=404, detail="该基金不在关注列表中")

        # 获取基金名称用于返回消息
        fund_name = fund.name

        # 删除关注项
        db.delete(watchlist_item)
        db.commit()

        return APIResponse(
            success=True,
            message=f"已从关注列表中移除 {fund_name}"
        )
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"移除关注失败: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())  # 打印堆栈信息
        raise HTTPException(status_code=500, detail=error_msg)
