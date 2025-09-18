"""
移动均线交叉策略 (Moving Average Cross Strategy)

策略逻辑：
1. 计算短期移动均线（默认5日）和长期移动均线（默认20日）
2. 当短期均线上穿长期均线时（金叉），产生买入信号
3. 当短期均线下穿长期均线时（死叉），产生卖出信号
4. 结合成交量进行信号强度调整，提高准确性
"""
import pandas as pd
import numpy as np
from .base_strategy import BaseStrategy, StrategySignal, SignalType


class MACrossStrategy(BaseStrategy):
    """移动均线交叉策略"""
    
    def __init__(self, config: dict = None):
        default_config = {
            'short_period': 5,      # 短期均线周期
            'long_period': 20,      # 长期均线周期
            'volume_threshold': 1.2, # 成交量阈值倍数
            'min_data_points': 25   # 最少数据点数
        }
        
        if config:
            default_config.update(config)
            
        super().__init__("MA_Cross_Strategy", default_config)
    
    def calculate_signal(self, data: pd.DataFrame) -> StrategySignal:
        """
        计算移动均线交叉策略信号
        
        Args:
            data: 包含净值数据的 DataFrame
            
        Returns:
            StrategySignal: 策略信号
        """
        # 验证数据
        if not self.validate_data(data):
            return StrategySignal(
                SignalType.HOLD,
                0.0,
                "数据不足或无效，无法计算信号"
            )
        
        # 确保数据按日期排序
        data = data.sort_values('date').copy()
        
        # 计算移动均线
        short_ma = self.calculate_moving_average(
            data['net_value'], 
            self.config['short_period']
        )
        long_ma = self.calculate_moving_average(
            data['net_value'], 
            self.config['long_period']
        )
        
        # 获取最新的均线值
        current_short_ma = short_ma.iloc[-1]
        current_long_ma = long_ma.iloc[-1]
        
        # 获取前一日的均线值（用于判断交叉）
        if len(short_ma) >= 2:
            prev_short_ma = short_ma.iloc[-2]
            prev_long_ma = long_ma.iloc[-2]
        else:
            prev_short_ma = current_short_ma
            prev_long_ma = current_long_ma
        
        # 计算均线差值和变化率
        ma_diff = current_short_ma - current_long_ma
        ma_diff_pct = (ma_diff / current_long_ma) * 100
        
        # 判断交叉情况
        golden_cross = (prev_short_ma <= prev_long_ma and 
                       current_short_ma > current_long_ma)  # 金叉
        death_cross = (prev_short_ma >= prev_long_ma and 
                      current_short_ma < current_long_ma)   # 死叉
        
        # 计算成交量因子（如果有成交量数据）
        volume_factor = 1.0
        if 'volume' in data.columns and not data['volume'].isna().all():
            recent_volume = data['volume'].tail(5).mean()
            avg_volume = data['volume'].mean()
            if avg_volume > 0:
                volume_factor = min(recent_volume / avg_volume, 2.0)
        
        # 计算价格趋势强度
        price_trend = self._calculate_price_trend(data['net_value'])
        
        # 生成信号
        signal_type = SignalType.HOLD
        strength = 0.0
        reason = ""
        
        if golden_cross:
            signal_type = SignalType.BUY
            # 基础强度：根据均线差值百分比
            base_strength = min(abs(ma_diff_pct) / 2.0, 0.8)
            # 成交量调整
            volume_adjustment = (volume_factor - 1.0) * 0.2
            # 趋势调整
            trend_adjustment = max(price_trend, 0) * 0.3
            
            strength = min(base_strength + volume_adjustment + trend_adjustment, 1.0)
            
            reason = f"金叉信号：短期均线({self.config['short_period']}日)上穿长期均线({self.config['long_period']}日)"
            if volume_factor > self.config['volume_threshold']:
                reason += f"，成交量放大{volume_factor:.1f}倍"
            
        elif death_cross:
            signal_type = SignalType.SELL
            # 基础强度：根据均线差值百分比
            base_strength = min(abs(ma_diff_pct) / 2.0, 0.8)
            # 成交量调整
            volume_adjustment = (volume_factor - 1.0) * 0.2
            # 趋势调整（下跌趋势增强卖出信号）
            trend_adjustment = max(-price_trend, 0) * 0.3
            
            strength = min(base_strength + volume_adjustment + trend_adjustment, 1.0)
            
            reason = f"死叉信号：短期均线({self.config['short_period']}日)下穿长期均线({self.config['long_period']}日)"
            if volume_factor > self.config['volume_threshold']:
                reason += f"，成交量放大{volume_factor:.1f}倍"
                
        else:
            # 无交叉，判断当前趋势
            if abs(ma_diff_pct) > 1.0:  # 均线差值超过1%
                if ma_diff > 0:
                    signal_type = SignalType.BUY
                    strength = min(abs(ma_diff_pct) / 5.0, 0.6)  # 持续信号强度较低
                    reason = f"短期均线持续在长期均线上方 {ma_diff_pct:.2f}%，维持看涨"
                else:
                    signal_type = SignalType.SELL
                    strength = min(abs(ma_diff_pct) / 5.0, 0.6)
                    reason = f"短期均线持续在长期均线下方 {abs(ma_diff_pct):.2f}%，维持看跌"
            else:
                reason = "均线粘合，等待明确方向信号"
        
        # 构建技术指标数据
        indicators = {
            'short_ma': round(current_short_ma, 4),
            'long_ma': round(current_long_ma, 4),
            'ma_diff_pct': round(ma_diff_pct, 4),
            'volume_factor': round(volume_factor, 2),
            'price_trend': round(price_trend, 4),
            'golden_cross': golden_cross,
            'death_cross': death_cross
        }
        
        return StrategySignal(
            signal_type=signal_type,
            strength=strength,
            reason=reason,
            indicators=indicators
        )
    
    def _calculate_price_trend(self, prices: pd.Series, period: int = 10) -> float:
        """
        计算价格趋势强度
        
        Args:
            prices: 价格序列
            period: 计算周期
            
        Returns:
            趋势强度 (-1 到 1，正值表示上涨趋势，负值表示下跌趋势)
        """
        if len(prices) < period:
            period = len(prices)
        
        recent_prices = prices.tail(period)
        
        # 使用线性回归计算趋势
        x = np.arange(len(recent_prices))
        y = recent_prices.values
        
        # 计算斜率
        slope = np.polyfit(x, y, 1)[0]
        
        # 标准化斜率（相对于平均价格）
        avg_price = recent_prices.mean()
        normalized_slope = (slope * period) / avg_price
        
        # 限制在 -1 到 1 之间
        return max(-1.0, min(1.0, normalized_slope * 10))
    
    def get_strategy_description(self) -> dict:
        """获取策略描述"""
        return {
            'name': self.name,
            'description': '移动均线交叉策略，基于短期和长期均线的金叉死叉产生交易信号',
            'parameters': {
                'short_period': {
                    'value': self.config['short_period'],
                    'description': '短期移动均线周期（天）'
                },
                'long_period': {
                    'value': self.config['long_period'],
                    'description': '长期移动均线周期（天）'
                },
                'volume_threshold': {
                    'value': self.config['volume_threshold'],
                    'description': '成交量放大阈值倍数'
                }
            },
            'signals': {
                'BUY': '短期均线上穿长期均线（金叉）',
                'SELL': '短期均线下穿长期均线（死叉）',
                'HOLD': '均线未发生交叉或信号不明确'
            }
        }