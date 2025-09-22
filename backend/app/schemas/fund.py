"""
基金相关的 Pydantic 模型
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class SignalTypeEnum(str, Enum):
    """信号类型枚举"""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class FundBase(BaseModel):
    """基金基础模型"""
    code: str = Field(..., description="基金代码")
    name: str = Field(..., description="基金名称")
    fund_type: Optional[str] = Field(None, description="基金类型")
    manager: Optional[str] = Field(None, description="基金经理")
    company: Optional[str] = Field(None, description="基金公司")


class FundCreate(FundBase):
    """创建基金模型"""
    pass


class FundUpdate(BaseModel):
    """更新基金模型"""
    name: Optional[str] = None
    fund_type: Optional[str] = None
    manager: Optional[str] = None
    company: Optional[str] = None


class FundInfo(FundBase):
    """基金信息响应模型"""
    id: int
    establish_date: Optional[str] = None
    scale: Optional[float] = Field(None, description="基金规模(亿元)")
    current_nav: Optional[float] = Field(None, description="当前净值")
    accumulated_nav: Optional[float] = Field(None, description="累计净值")
    daily_return: Optional[float] = Field(None, description="日收益率")
    description: Optional[str] = Field(None, description="基金描述")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @field_validator('establish_date', mode='before')
    def _normalize_establish_date(cls, value):  # noqa: D401 - simple normalization
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%d')
        value_str = str(value).strip()
        return value_str or None


class FundNetValueBase(BaseModel):
    """基金净值基础模型"""
    date: str = Field(..., description="净值日期")  # 修改为字符串类型
    unit_nav: float = Field(..., description="单位净值")  # 修改字段名
    accumulated_nav: Optional[float] = Field(None, description="累计净值")  # 修改字段名
    daily_return: Optional[float] = Field(None, description="日收益率")


class FundNetValue(FundNetValueBase):
    """基金净值响应模型"""
    id: Optional[int] = None
    fund_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FundSearchRequest(BaseModel):
    """基金搜索请求模型"""
    keyword: str = Field(..., min_length=1, max_length=50, description="搜索关键词")
    limit: int = Field(20, ge=1, le=100, description="返回结果数量限制")


class FundSearchResult(BaseModel):
    """基金搜索结果模型"""
    id: str
    code: str
    name: str
    fund_type: Optional[str] = None
    manager: Optional[str] = None
    company: Optional[str] = None


class FundRealtimeData(BaseModel):
    """基金实时数据模型"""
    code: str
    current_value: float = Field(..., description="当前估值")
    change_percent: float = Field(..., description="涨跌幅百分比")
    update_time: str = Field(..., description="更新时间")
    previous_value: float = Field(..., description="昨日净值")


class StrategySignalResponse(BaseModel):
    """策略信号响应模型"""
    signal_type: SignalTypeEnum = Field(..., description="信号类型")
    strength: float = Field(..., ge=0, le=1, description="信号强度")
    reason: str = Field(..., description="信号原因")
    indicators: Dict[str, Any] = Field(default_factory=dict, description="技术指标数据")
    timestamp: datetime = Field(..., description="信号时间戳")


class StrategyAnalysisRequest(BaseModel):
    """策略分析请求模型"""
    fund_code: str = Field(..., description="基金代码")
    strategy_name: Optional[str] = Field(None, description="策略名称，为空则返回所有策略")
    start_date: Optional[str] = Field(None, description="开始日期 YYYY-MM-DD")
    end_date: Optional[str] = Field(None, description="结束日期 YYYY-MM-DD")


class StrategyAnalysisResponse(BaseModel):
    """策略分析响应模型"""
    fund_code: str
    fund_name: str
    analysis_date: datetime
    signals: Dict[str, StrategySignalResponse]
    consensus_signal: Optional[StrategySignalResponse] = None


class WatchListBase(BaseModel):
    """关注列表基础模型"""
    fund_code: str = Field(..., description="基金代码")


class WatchListCreate(WatchListBase):
    """创建关注列表模型"""
    pass


class WatchListRequest(BaseModel):
    """关注列表请求模型"""
    fund_code: str = Field(..., description="基金代码")


class WatchListResponse(BaseModel):
    """关注列表响应模型"""
    id: str
    fund_id: str
    fund_code: str
    fund_name: str
    fund_type: Optional[str] = None
    manager: Optional[str] = None
    company: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True


class HoldingBase(BaseModel):
    """持仓基础模型"""
    fund_code: str = Field(..., description="基金代码")
    shares: float = Field(..., gt=0, description="持有份额")
    cost_price: float = Field(..., gt=0, description="成本价格")
    purchase_date: datetime = Field(..., description="购买日期")


class HoldingCreate(HoldingBase):
    """创建持仓模型"""
    pass


class HoldingUpdate(BaseModel):
    """更新持仓模型"""
    shares: Optional[float] = Field(None, gt=0)
    cost_price: Optional[float] = Field(None, gt=0)
    purchase_date: Optional[datetime] = None


class HoldingResponse(BaseModel):
    """持仓响应模型"""
    id: int
    fund_code: str
    fund_name: str
    shares: float
    cost_price: float
    purchase_date: datetime
    current_value: Optional[float] = None
    market_value: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_percent: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PortfolioSummary(BaseModel):
    """投资组合汇总模型"""
    total_cost: float = Field(..., description="总成本")
    total_market_value: float = Field(..., description="总市值")
    total_profit_loss: float = Field(..., description="总盈亏")
    total_profit_loss_percent: float = Field(..., description="总盈亏百分比")
    holdings_count: int = Field(..., description="持仓数量")
    holdings: List[HoldingResponse] = Field(default_factory=list, description="持仓列表")


class FundDetailResponse(BaseModel):
    """基金详情响应模型"""
    fund_info: FundInfo
    realtime_data: Optional[FundRealtimeData] = None
    net_values: List[FundNetValue] = Field(default_factory=list)
    strategy_signals: Dict[str, StrategySignalResponse] = Field(default_factory=dict)
    consensus_signal: Optional[StrategySignalResponse] = None


class APIResponse(BaseModel):
    """通用 API 响应模型"""
    success: bool = True
    message: str = "操作成功"
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class PaginatedResponse(BaseModel):
    """分页响应模型"""
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int
