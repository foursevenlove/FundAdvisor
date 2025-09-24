"""投资组合端点"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....schemas.portfolio import (
    HoldingCreatePayload,
    HoldingUpdatePayload,
    PortfolioResponse,
)
from ....services.portfolio_service import PortfolioService


router = APIRouter()


@router.get("/", response_model=PortfolioResponse)
def get_portfolio(db: Session = Depends(get_db)) -> PortfolioResponse:
    """返回投资组合摘要与持仓明细"""

    return PortfolioService.get_portfolio(db)


@router.post("/holdings", response_model=PortfolioResponse, status_code=201)
def create_holding(
    payload: HoldingCreatePayload,
    db: Session = Depends(get_db),
) -> PortfolioResponse:
    """新增一条持仓记录并返回最新投资组合"""

    return PortfolioService.create_holding(db, payload)


@router.put("/holdings/{holding_id}", response_model=PortfolioResponse)
def update_holding(
    holding_id: int,
    payload: HoldingUpdatePayload,
    db: Session = Depends(get_db),
) -> PortfolioResponse:
    """更新持仓信息并返回最新投资组合"""

    return PortfolioService.update_holding(db, holding_id, payload)


@router.delete("/holdings/{holding_id}", response_model=PortfolioResponse)
def delete_holding(holding_id: int, db: Session = Depends(get_db)) -> PortfolioResponse:
    """删除持仓并返回最新投资组合"""

    return PortfolioService.delete_holding(db, holding_id)
