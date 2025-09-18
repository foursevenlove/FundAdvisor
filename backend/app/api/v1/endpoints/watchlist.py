"""
关注列表相关 API 端点
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ....core.database import get_db
from ....models import WatchList, Fund, User
from ....schemas import WatchListRequest, WatchListResponse, APIResponse

router = APIRouter()

# 临时内存存储（用于演示，实际项目应使用数据库）
_memory_watchlist = []


@router.get("/", response_model=List[WatchListResponse])
async def get_watchlist(
    db: Session = Depends(get_db)
):
    """
    获取用户关注列表

    注意：当前版本使用内存存储，重启后数据会丢失
    """
    try:
        # 尝试从数据库获取，如果失败则使用内存存储
        try:
            user_id = 1
            watchlist_items = (
                db.query(WatchList)
                .join(Fund, WatchList.fund_id == Fund.id)
                .filter(WatchList.user_id == user_id)
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
        except Exception:
            # 使用内存存储
            return _memory_watchlist

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取关注列表失败: {str(e)}")


@router.post("/", response_model=APIResponse)
async def add_to_watchlist(
    request: WatchListRequest,
    db: Session = Depends(get_db)
):
    """
    添加基金到关注列表
    """
    try:
        # 尝试使用数据库，如果失败则使用内存存储
        try:
            user_id = 1

            # 检查基金是否存在
            fund = db.query(Fund).filter(Fund.id == request.fund_id).first()
            if not fund:
                raise HTTPException(status_code=404, detail="基金不存在")

            # 检查是否已经关注
            existing = db.query(WatchList).filter(
                WatchList.user_id == user_id,
                WatchList.fund_id == request.fund_id
            ).first()

            if existing:
                return APIResponse(
                    success=True,
                    message=f"基金 {fund.name} 已在关注列表中"
                )

            # 添加到关注列表
            watchlist_item = WatchList(
                user_id=user_id,
                fund_id=request.fund_id
            )

            db.add(watchlist_item)
            db.commit()

            return APIResponse(
                success=True,
                message=f"已添加 {fund.name} 到关注列表"
            )

        except Exception:
            # 使用内存存储
            fund_id = request.fund_id

            # 检查是否已经关注
            for item in _memory_watchlist:
                if item.fund_id == fund_id:
                    return APIResponse(
                        success=True,
                        message="基金已在关注列表中"
                    )

            # 创建新的关注项（模拟数据）
            new_item = WatchListResponse(
                id=str(len(_memory_watchlist) + 1),
                fund_id=fund_id,
                fund_code=fund_id,  # 简化处理，使用fund_id作为code
                fund_name=f"基金 {fund_id}",
                fund_type="混合型",
                manager="",
                company="",
                created_at=datetime.now().isoformat()
            )

            _memory_watchlist.append(new_item)

            return APIResponse(
                success=True,
                message=f"已添加基金 {fund_id} 到关注列表"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加到关注列表失败: {str(e)}")


@router.delete("/{fund_id}", response_model=APIResponse)
async def remove_from_watchlist(
    fund_id: str,
    db: Session = Depends(get_db)
):
    """
    从关注列表中移除基金
    """
    try:
        # 尝试使用数据库，如果失败则使用内存存储
        try:
            user_id = 1

            # 查找关注项
            watchlist_item = db.query(WatchList).filter(
                WatchList.user_id == user_id,
                WatchList.fund_id == fund_id
            ).first()

            if not watchlist_item:
                raise HTTPException(status_code=404, detail="该基金不在关注列表中")

            # 获取基金名称用于返回消息
            fund = db.query(Fund).filter(Fund.id == fund_id).first()
            fund_name = fund.name if fund else "基金"

            # 删除关注项
            db.delete(watchlist_item)
            db.commit()

            return APIResponse(
                success=True,
                message=f"已从关注列表中移除 {fund_name}"
            )

        except Exception:
            # 使用内存存储
            global _memory_watchlist
            original_count = len(_memory_watchlist)
            _memory_watchlist = [item for item in _memory_watchlist if item.fund_id != fund_id]

            if len(_memory_watchlist) == original_count:
                raise HTTPException(status_code=404, detail="该基金不在关注列表中")

            return APIResponse(
                success=True,
                message=f"已从关注列表中移除基金 {fund_id}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"移除关注失败: {str(e)}")