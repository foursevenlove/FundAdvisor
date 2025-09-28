"""
关注列表相关 API 端点
"""
import traceback

from fastapi import APIRouter, Depends, HTTPException
import logging
from sqlalchemy.orm import Session
from typing import List

from ....core.database import get_db
from ....models import WatchList, Fund
from ....schemas import WatchListRequest, WatchListResponse, APIResponse

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
        # 检查基金是否存在
        fund = db.query(Fund).filter(Fund.code == request.fund_code).first()
        if not fund:
            raise HTTPException(status_code=404, detail="基金不存在")

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