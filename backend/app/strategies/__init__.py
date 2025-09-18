"""
投资策略模块
"""
from .base_strategy import BaseStrategy, StrategySignal, SignalType
from .ma_cross_strategy import MACrossStrategy
from .dynamic_dca_strategy import DynamicDCAStrategy
from .trend_following_strategy import TrendFollowingStrategy
from .strategy_manager import StrategyManager, strategy_manager

__all__ = [
    "BaseStrategy",
    "StrategySignal", 
    "SignalType",
    "MACrossStrategy",
    "DynamicDCAStrategy",
    "TrendFollowingStrategy",
    "StrategyManager",
    "strategy_manager"
]