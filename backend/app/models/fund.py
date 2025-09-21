"""
基金相关数据模型
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Fund(Base):
    """基金基础信息表"""
    __tablename__ = "funds"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False, comment="基金代码")
    name = Column(String(100), nullable=False, comment="基金名称")
    fund_type = Column(String(50), comment="基金类型")
    manager = Column(String(100), comment="基金经理")
    company = Column(String(100), comment="基金公司")
    establish_date = Column(DateTime, comment="成立日期")
    scale = Column(Float, comment="基金规模(亿元)")
    current_nav = Column(Float, comment="当前净值")
    accumulated_nav = Column(Float, comment="累计净值")
    daily_return = Column(Float, comment="最新日收益率(%)")
    description = Column(Text, comment="基金描述")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关联关系
    net_values = relationship("FundNetValue", back_populates="fund")
    watchlists = relationship("WatchList", back_populates="fund")
    holdings = relationship("Holding", back_populates="fund")


class FundNetValue(Base):
    """基金净值历史数据表"""
    __tablename__ = "fund_net_values"
    
    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    date = Column(DateTime, nullable=False, index=True, comment="净值日期")
    net_value = Column(Float, nullable=False, comment="单位净值")
    accumulated_value = Column(Float, comment="累计净值")
    daily_return = Column(Float, comment="日收益率")
    volume = Column(Float, comment="成交量")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    fund = relationship("Fund", back_populates="net_values")


class WatchList(Base):
    """用户关注列表表"""
    __tablename__ = "watchlists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    fund = relationship("Fund", back_populates="watchlists")
    user = relationship("User", back_populates="watchlists")


class Holding(Base):
    """用户持仓表"""
    __tablename__ = "holdings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    shares = Column(Float, nullable=False, comment="持有份额")
    cost_price = Column(Float, nullable=False, comment="成本价格")
    purchase_date = Column(DateTime, nullable=False, comment="购买日期")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关联关系
    fund = relationship("Fund", back_populates="holdings")
    user = relationship("User", back_populates="holdings")


class StrategySignal(Base):
    """策略信号表"""
    __tablename__ = "strategy_signals"
    
    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    strategy_name = Column(String(50), nullable=False, comment="策略名称")
    signal_type = Column(String(10), nullable=False, comment="信号类型: BUY/SELL/HOLD")
    signal_strength = Column(Float, comment="信号强度 0-1")
    reason = Column(Text, comment="信号原因")
    indicators = Column(Text, comment="技术指标数据(JSON)")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    fund = relationship("Fund")