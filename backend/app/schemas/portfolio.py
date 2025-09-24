"""投资组合相关的 Pydantic 模型"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict, model_validator


class PortfolioHolding(BaseModel):
    """前端持仓行所需的序列化结构"""

    id: int = Field(..., description="持仓记录ID")
    fund_id: int = Field(..., description="基金ID")
    fund_code: str = Field(..., description="基金代码")
    fund_name: str = Field(..., description="基金名称")
    fund_type: Optional[str] = Field(None, description="基金类型")
    shares: float = Field(..., description="持有份额")
    avg_cost: float = Field(..., description="平均持仓成本")
    current_value: float = Field(..., description="最新净值/估值")
    market_value: float = Field(..., description="持仓市值")
    total_return: float = Field(..., description="累计收益")
    total_return_percent: float = Field(..., description="累计收益率(%)")
    day_return: float = Field(..., description="当日收益")
    day_return_percent: float = Field(..., description="当日收益率(%)")
    weight: float = Field(..., description="仓位占比(%)")


class PortfolioSummary(BaseModel):
    """投资组合汇总信息"""

    total_assets: float = Field(..., description="资产总市值")
    total_cost: float = Field(..., description="持仓总成本")
    total_return: float = Field(..., description="累计收益")
    total_return_percent: float = Field(..., description="累计收益率(%)")
    day_return: float = Field(..., description="当日收益")
    day_return_percent: float = Field(..., description="当日收益率(%)")


class PortfolioResponse(BaseModel):
    """GET /api/v1/portfolio 响应结构"""

    summary: PortfolioSummary
    holdings: List[PortfolioHolding]


class HoldingCreatePayload(BaseModel):
    """创建持仓请求体"""

    fund_id: Optional[int] = Field(None, gt=0, description="基金ID")
    fund_code: Optional[str] = Field(None, min_length=1, description="基金代码")
    shares: float = Field(..., gt=0, description="持有份额")
    avg_cost: Optional[float] = Field(None, gt=0, description="平均持仓成本")
    cost: Optional[float] = Field(None, gt=0, description="平均持仓成本(cost别名)")
    purchase_date: Optional[datetime] = Field(None, description="最近交易日期")

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_payload(self) -> "HoldingCreatePayload":  # noqa: D401 - validation helper
        if self.fund_id is None and not self.fund_code:
            raise ValueError("必须提供基金ID或基金代码")
        if self.avg_cost is None and self.cost is None:
            raise ValueError("必须提供平均成本(avg_cost/cost)")
        return self

    def resolved_avg_cost(self) -> float:
        """返回用于持仓计算的平均成本"""

        return float(self.avg_cost or self.cost)  # type: ignore[return-value]


class HoldingUpdatePayload(BaseModel):
    """更新持仓请求体"""

    shares: Optional[float] = Field(None, gt=0, description="持有份额")
    avg_cost: Optional[float] = Field(None, gt=0, description="平均成本")
    cost: Optional[float] = Field(None, gt=0, description="平均成本(cost别名)")
    purchase_date: Optional[datetime] = Field(None, description="最近交易日期")

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_payload(self) -> "HoldingUpdatePayload":  # noqa: D401 - validation helper
        if not any([self.shares, self.avg_cost, self.cost, self.purchase_date]):
            raise ValueError("必须提供至少一个需要更新的字段")
        return self

    def resolved_avg_cost(self) -> Optional[float]:
        """获取更新后的平均成本"""

        if self.avg_cost is not None:
            return float(self.avg_cost)
        if self.cost is not None:
            return float(self.cost)
        return None
