"""投资组合相关业务逻辑"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..models import Fund, Holding
from ..schemas.portfolio import (
    HoldingCreatePayload,
    HoldingUpdatePayload,
    PortfolioHolding,
    PortfolioResponse,
    PortfolioSummary,
)


class PortfolioService:
    """封装投资组合计算与CRUD逻辑"""

    @staticmethod
    def _resolve_fund(db: Session, fund_id: Optional[int], fund_code: Optional[str]) -> Fund:
        query = None
        if fund_id is not None:
            fund = db.get(Fund, fund_id)
            if fund is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="基金不存在")
            return fund

        if fund_code:
            query = select(Fund).where(Fund.code == fund_code)
            fund = db.scalar(query)
            if fund is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="基金不存在")
            return fund

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="必须提供基金标识")

    @staticmethod
    def _build_holding_payload(holding: Holding) -> dict:
        fund = holding.fund
        if fund is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="持仓缺少关联基金信息")

        current_value = fund.current_nav if fund.current_nav is not None else holding.avg_cost
        current_value = float(current_value or 0)
        shares = float(holding.shares or 0)
        avg_cost = float(holding.avg_cost or 0)

        market_value = current_value * shares
        cost_basis = avg_cost * shares
        total_return = market_value - cost_basis
        total_return_percent = (total_return / cost_basis * 100) if cost_basis else 0.0

        day_return_percent = float(fund.daily_return or 0.0)
        day_return = market_value * day_return_percent / 100 if day_return_percent else 0.0

        return {
            "id": holding.id,
            "fund_id": fund.id,
            "fund_code": fund.code,
            "fund_name": fund.name,
            "fund_type": fund.fund_type,
            "shares": shares,
            "avg_cost": avg_cost,
            "current_value": current_value,
            "market_value": market_value,
            "total_return": total_return,
            "total_return_percent": total_return_percent,
            "day_return": day_return,
            "day_return_percent": day_return_percent,
            "weight": 0.0,
        }

    @staticmethod
    def get_portfolio(db: Session) -> PortfolioResponse:
        holdings: List[Holding] = (
            db.execute(
                select(Holding).options(joinedload(Holding.fund)).order_by(Holding.id)
            )
            .scalars()
            .all()
        )

        if not holdings:
            empty_summary = PortfolioSummary(
                total_assets=0.0,
                total_cost=0.0,
                total_return=0.0,
                total_return_percent=0.0,
                day_return=0.0,
                day_return_percent=0.0,
            )
            return PortfolioResponse(summary=empty_summary, holdings=[])

        serialized = [PortfolioService._build_holding_payload(holding) for holding in holdings]

        total_assets = sum(item["market_value"] for item in serialized)
        total_cost = sum(float(holding.avg_cost) * float(holding.shares) for holding in holdings)
        total_return = total_assets - total_cost
        day_return_total = sum(item["day_return"] for item in serialized)

        for item in serialized:
            item["weight"] = (item["market_value"] / total_assets * 100) if total_assets else 0.0

        summary = PortfolioSummary(
            total_assets=total_assets,
            total_cost=total_cost,
            total_return=total_return,
            total_return_percent=(total_return / total_cost * 100) if total_cost else 0.0,
            day_return=day_return_total,
            day_return_percent=(day_return_total / total_assets * 100) if total_assets else 0.0,
        )

        holdings_payload = [PortfolioHolding(**item) for item in serialized]

        return PortfolioResponse(summary=summary, holdings=holdings_payload)

    @staticmethod
    def create_holding(db: Session, payload: HoldingCreatePayload) -> PortfolioResponse:
        fund = PortfolioService._resolve_fund(db, payload.fund_id, payload.fund_code)

        holding = Holding(
            fund_id=fund.id,
            shares=payload.shares,
            avg_cost=payload.resolved_avg_cost(),
            purchase_date=payload.purchase_date or datetime.utcnow(),
        )
        db.add(holding)
        db.commit()
        db.refresh(holding)

        return PortfolioService.get_portfolio(db)

    @staticmethod
    def update_holding(db: Session, holding_id: int, payload: HoldingUpdatePayload) -> PortfolioResponse:
        holding = db.get(Holding, holding_id)
        if holding is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="持仓不存在")

        if payload.shares is not None:
            holding.shares = payload.shares
        resolved_cost = payload.resolved_avg_cost()
        if resolved_cost is not None:
            holding.avg_cost = resolved_cost
        if payload.purchase_date is not None:
            holding.purchase_date = payload.purchase_date

        db.add(holding)
        db.commit()
        db.refresh(holding)

        return PortfolioService.get_portfolio(db)

    @staticmethod
    def delete_holding(db: Session, holding_id: int) -> PortfolioResponse:
        holding = db.get(Holding, holding_id)
        if holding is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="持仓不存在")

        db.delete(holding)
        db.commit()

        return PortfolioService.get_portfolio(db)
