"""
基础策略类 - 所有投资策略的基类
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
from enum import Enum
import pandas as pd
import numpy as np
from datetime import datetime


class SignalType(Enum):
    """信号类型枚举"""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class StrategySignal:
    """策略信号类"""
    
    def __init__(self, 
                 signal_type: SignalType,
                 strength: float,
                 reason: str,
                 indicators: Dict = None,
                 timestamp: datetime = None):
        self.signal_type = signal_type
        self.strength = max(0.0, min(1.0, strength))  # 限制在 0-1 之间
        self.reason = reason
        self.indicators = indicators or {}
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self) -> Dict:
        """转换为字典格式"""
        return {
            'signal_type': self.signal_type.value,
            'strength': self.strength,
            'reason': self.reason,
            'indicators': self.indicators,
            'timestamp': self.timestamp.isoformat()
        }


class BaseStrategy(ABC):
    """基础策略抽象类"""
    
    def __init__(self, name: str, config: Dict = None):
        self.name = name
        self.config = config or {}
    
    @abstractmethod
    def calculate_signal(self, data: pd.DataFrame) -> StrategySignal:
        """
        计算策略信号
        
        Args:
            data: 包含净值数据的 DataFrame，必须包含以下列：
                  - date: 日期
                  - net_value: 净值
                  - volume: 成交量（可选）
                  
        Returns:
            StrategySignal: 策略信号对象
        """
        pass
    
    def validate_data(self, data: pd.DataFrame) -> bool:
        """
        验证输入数据的有效性
        
        Args:
            data: 净值数据 DataFrame
            
        Returns:
            bool: 数据是否有效
        """
        required_columns = ['date', 'net_value']
        
        if data.empty:
            return False
            
        for col in required_columns:
            if col not in data.columns:
                return False
        
        # 检查数据量是否足够
        min_data_points = self.config.get('min_data_points', 30)
        if len(data) < min_data_points:
            return False
            
        return True
    
    def calculate_moving_average(self, data: pd.Series, period: int) -> pd.Series:
        """计算移动平均线"""
        return data.rolling(window=period, min_periods=1).mean()
    
    def calculate_rsi(self, data: pd.Series, period: int = 14) -> pd.Series:
        """
        计算相对强弱指数 (RSI)
        
        Args:
            data: 价格数据
            period: 计算周期
            
        Returns:
            RSI 值序列
        """
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def calculate_macd(self, data: pd.Series, 
                      fast_period: int = 12, 
                      slow_period: int = 26, 
                      signal_period: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """
        计算 MACD 指标
        
        Args:
            data: 价格数据
            fast_period: 快线周期
            slow_period: 慢线周期
            signal_period: 信号线周期
            
        Returns:
            (MACD线, 信号线, 柱状图)
        """
        ema_fast = data.ewm(span=fast_period).mean()
        ema_slow = data.ewm(span=slow_period).mean()
        
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal_period).mean()
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram
    
    def calculate_bollinger_bands(self, data: pd.Series, 
                                 period: int = 20, 
                                 std_dev: float = 2) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """
        计算布林带
        
        Args:
            data: 价格数据
            period: 计算周期
            std_dev: 标准差倍数
            
        Returns:
            (上轨, 中轨, 下轨)
        """
        middle_band = self.calculate_moving_average(data, period)
        std = data.rolling(window=period).std()
        
        upper_band = middle_band + (std * std_dev)
        lower_band = middle_band - (std * std_dev)
        
        return upper_band, middle_band, lower_band
    
    def calculate_percentile_rank(self, data: pd.Series, lookback_days: int = 252) -> pd.Series:
        """
        计算百分位排名
        
        Args:
            data: 数据序列
            lookback_days: 回看天数
            
        Returns:
            百分位排名序列 (0-100)
        """
        def percentile_rank(x):
            if len(x) < 2:
                return 50.0
            return (x.rank().iloc[-1] - 1) / (len(x) - 1) * 100
        
        return data.rolling(window=lookback_days, min_periods=1).apply(percentile_rank)