
"""
动态定投策略 (Dynamic Dollar Cost Averaging Strategy)

策略逻辑：
1. 基于基金历史估值百分位进行投资决策
2. 当估值位于历史低位（如25%分位以下）时，建议买入
3. 当估值位于历史高位（如75%分位以上）时，建议卖出
4. 中间区域根据具体百分位给出不同强度的建议
5. 支持用户自定义估值分位阈值
"""
import pandas as pd
import numpy as np
from .base_strategy import BaseStrategy, StrategySignal, SignalType


class DynamicDCAStrategy(BaseStrategy):
    """动态定投策略"""
    
    def __init__(self, config: dict = None):
        default_config = {
            'low_percentile': 25,    # 低估值分位线
            'high_percentile': 75,   # 高估值分位线
            'lookback_days': 252,    # 回看天数（约1年）
            'min_data_points': 60,   # 最少数据点数
            'pe_weight': 0.4,        # PE估值权重
            'pb_weight': 0.3,        # PB估值权重
            'price_weight': 0.3      # 价格百分位权重
        }
        
        if config:
            default_config.update(config)
            
        super().__init__("Dynamic_DCA_Strategy", default_config)
    
    def calculate_signal(self, data: pd.DataFrame) -> StrategySignal:
        """
        计算动态定投策略信号
        
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
        
        # 计算价格百分位
        price_percentile = self._calculate_price_percentile(data)
        
        # 计算估值指标（模拟PE、PB等）
        valuation_metrics = self._calculate_valuation_metrics(data)
        
        # 综合估值百分位
        composite_percentile = self._calculate_composite_percentile(
            price_percentile, valuation_metrics
        )
        
        # 计算市场情绪指标
        market_sentiment = self._calculate_market_sentiment(data)
        
        # 生成信号
        signal_type, strength, reason = self._generate_signal(
            composite_percentile, market_sentiment, data
        )
        
        # 构建技术指标数据
        indicators = {
            'price_percentile': round(price_percentile, 2),
            'composite_percentile': round(composite_percentile, 2),
            'market_sentiment': round(market_sentiment, 4),
            'current_price': round(data['net_value'].iloc[-1], 4),
            'avg_price_1y': round(data['net_value'].tail(min(252, len(data))).mean(), 4),
            'volatility': round(self._calculate_volatility(data), 4),
            **valuation_metrics
        }
        
        return StrategySignal(
            signal_type=signal_type,
            strength=strength,
            reason=reason,
            indicators=indicators
        )
    
    def _calculate_price_percentile(self, data: pd.DataFrame) -> float:
        """
        计算当前价格在历史数据中的百分位
        
        Args:
            data: 净值数据
            
        Returns:
            价格百分位 (0-100)
        """
        lookback_days = min(self.config['lookback_days'], len(data))
        recent_data = data.tail(lookback_days)
        
        current_price = data['net_value'].iloc[-1]
        historical_prices = recent_data['net_value']
        
        # 计算百分位排名
        percentile = (historical_prices < current_price).sum() / len(historical_prices) * 100
        
        return percentile
    
    def _calculate_valuation_metrics(self, data: pd.DataFrame) -> dict:
        """
        计算估值指标（模拟）
        
        Args:
            data: 净值数据
            
        Returns:
            估值指标字典
        """
        # 由于基金数据通常不包含PE、PB等指标，这里使用价格相关指标模拟
        
        # 模拟PE：基于价格与长期均线的比值
        long_ma = self.calculate_moving_average(data['net_value'], 60)
        current_pe_proxy = data['net_value'].iloc[-1] / long_ma.iloc[-1]
        
        # 计算PE代理指标的历史百分位
        lookback_days = min(self.config['lookback_days'], len(data) - 60)
        if lookback_days > 30:
            historical_pe = data['net_value'].tail(lookback_days) / long_ma.tail(lookback_days)
            pe_percentile = (historical_pe < current_pe_proxy).sum() / len(historical_pe) * 100
        else:
            pe_percentile = 50.0
        
        # 模拟PB：基于价格与历史最低价的比值
        historical_low = data['net_value'].tail(min(self.config['lookback_days'], len(data))).min()
        current_pb_proxy = data['net_value'].iloc[-1] / historical_low
        
        # 计算PB代理指标的历史百分位
        if len(data) > 30:
            rolling_low = data['net_value'].rolling(window=30, min_periods=1).min()
            historical_pb = data['net_value'] / rolling_low
            pb_percentile = (historical_pb < current_pb_proxy).sum() / len(historical_pb) * 100
        else:
            pb_percentile = 50.0
        
        return {
            'pe_proxy': round(current_pe_proxy, 4),
            'pe_percentile': round(pe_percentile, 2),
            'pb_proxy': round(current_pb_proxy, 4),
            'pb_percentile': round(pb_percentile, 2)
        }
    
    def _calculate_composite_percentile(self, price_percentile: float, 
                                      valuation_metrics: dict) -> float:
        """
        计算综合估值百分位
        
        Args:
            price_percentile: 价格百分位
            valuation_metrics: 估值指标
            
        Returns:
            综合百分位 (0-100)
        """
        # 加权平均计算综合百分位
        composite = (
            price_percentile * self.config['price_weight'] +
            valuation_metrics['pe_percentile'] * self.config['pe_weight'] +
            valuation_metrics['pb_percentile'] * self.config['pb_weight']
        )
        
        return composite
    
    def _calculate_market_sentiment(self, data: pd.DataFrame) -> float:
        """
        计算市场情绪指标
        
        Args:
            data: 净值数据
            
        Returns:
            市场情绪 (-1 到 1，负值表示悲观，正值表示乐观)
        """
        # 基于近期收益率分布计算情绪
        if 'daily_return' in data.columns:
            recent_returns = data['daily_return'].tail(20).dropna()
        else:
            # 计算日收益率
            returns = data['net_value'].pct_change().tail(20).dropna()
            recent_returns = returns * 100
        
        if len(recent_returns) < 5:
            return 0.0
        
        # 计算收益率的偏度（衡量分布的不对称性）
        mean_return = recent_returns.mean()
        std_return = recent_returns.std()
        
        if std_return == 0:
            return 0.0
        
        # 标准化收益率
        normalized_returns = (recent_returns - mean_return) / std_return
        
        # 计算偏度
        skewness = (normalized_returns ** 3).mean()
        
        # 结合平均收益率和波动率
        sentiment = (mean_return / max(std_return, 0.1)) * 0.7 + skewness * 0.3
        
        # 限制在 -1 到 1 之间
        return max(-1.0, min(1.0, sentiment))
    
    def _calculate_volatility(self, data: pd.DataFrame) -> float:
        """计算波动率"""
        if 'daily_return' in data.columns:
            returns = data['daily_return'].tail(30).dropna()
        else:
            returns = data['net_value'].pct_change().tail(30).dropna() * 100
        
        return returns.std() if len(returns) > 1 else 0.0
    
    def _generate_signal(self, composite_percentile: float, 
                        market_sentiment: float, data: pd.DataFrame) -> tuple:
        """
        根据综合指标生成交易信号
        
        Args:
            composite_percentile: 综合估值百分位
            market_sentiment: 市场情绪
            data: 净值数据
            
        Returns:
            (信号类型, 强度, 原因)
        """
        low_threshold = self.config['low_percentile']
        high_threshold = self.config['high_percentile']
        
        # 计算趋势因子
        trend_factor = self._calculate_trend_factor(data)
        
        if composite_percentile <= low_threshold:
            # 低估值区域 - 买入信号
            signal_type = SignalType.BUY
            
            # 基础强度：越低估值强度越高
            base_strength = (low_threshold - composite_percentile) / low_threshold * 0.8 + 0.2
            
            # 情绪调整：悲观情绪增强买入信号
            sentiment_adjustment = max(-market_sentiment, 0) * 0.2
            
            # 趋势调整：下跌趋势中的低估值更有价值
            trend_adjustment = max(-trend_factor, 0) * 0.1
            
            strength = min(base_strength + sentiment_adjustment + trend_adjustment, 1.0)
            
            reason = f"估值处于历史低位({composite_percentile:.1f}%分位)，建议逢低买入"
            if market_sentiment < -0.3:
                reason += "，市场情绪悲观提供更好买入机会"
                
        elif composite_percentile >= high_threshold:
            # 高估值区域 - 卖出信号
            signal_type = SignalType.SELL
            
            # 基础强度：越高估值强度越高
            base_strength = (composite_percentile - high_threshold) / (100 - high_threshold) * 0.8 + 0.2
            
            # 情绪调整：乐观情绪增强卖出信号
            sentiment_adjustment = max(market_sentiment, 0) * 0.2
            
            # 趋势调整：上涨趋势中的高估值风险更大
            trend_adjustment = max(trend_factor, 0) * 0.1
            
            strength = min(base_strength + sentiment_adjustment + trend_adjustment, 1.0)
            
            reason = f"估值处于历史高位({composite_percentile:.1f}%分位)，建议获利了结"
            if market_sentiment > 0.3:
                reason += "，市场情绪过于乐观需要谨慎"
                
        else:
            # 中性区域 - 根据具体位置和趋势判断
            mid_point = (low_threshold + high_threshold) / 2
            
            if composite_percentile < mid_point:
                # 偏向低估值
                signal_type = SignalType.BUY
                strength = (mid_point - composite_percentile) / (mid_point - low_threshold) * 0.5
                reason = f"估值适中偏低({composite_percentile:.1f}%分位)，可考虑分批买入"
            else:
                # 偏向高估值
                signal_type = SignalType.SELL
                strength = (composite_percentile - mid_point) / (high_threshold - mid_point) * 0.5
                reason = f"估值适中偏高({composite_percentile:.1f}%分位)，可考虑分批减仓"
            
            # 在中性区域，如果信号强度太低，改为持有
            if strength < 0.2:
                signal_type = SignalType.HOLD
                strength = 0.0
                reason = f"估值处于中性区域({composite_percentile:.1f}%分位)，建议持有观望"
        
        return signal_type, strength, reason
    
    def _calculate_trend_factor(self, data: pd.DataFrame) -> float:
        """
        计算趋势因子
        
        Args:
            data: 净值数据
            
        Returns:
            趋势因子 (-1 到 1)
        """
        if len(data) < 20:
            return 0.0
        
        # 使用多个时间周期的移动平均线判断趋势
        ma_5 = self.calculate_moving_average(data['net_value'], 5).iloc[-1]
        ma_20 = self.calculate_moving_average(data['net_value'], 20).iloc[-1]
        current_price = data['net_value'].iloc[-1]
        
        # 计算价格相对于均线的位置
        trend_5 = (current_price - ma_5) / ma_5
        trend_20 = (current_price - ma_20) / ma_20
        
        # 综合趋势因子
        trend_factor = (trend_5 * 0.6 + trend_20 * 0.4) * 10
        
        return max(-1.0, min(1.0, trend_factor))
    
    def get_strategy_description(self) -> dict:
        """获取策略描述"""
        return {
            'name': self.name,
            'description': '动态定投策略，基于历史估值百分位进行智能定投决策',
            'parameters': {
                'low_percentile': {
                    'value': self.config['low_percentile'],
                    'description': '低估值分位线阈值'
                },
                'high_percentile': {
                    'value': self.config['high_percentile'],
                    'description': '高估值分位线阈值'
                },
                'lookback_days': {
                    'value': self.config['lookback_days'],
                    'description': '历史数据回看天数'
                }
            },
            'signals': {
                'BUY': '估值处于历史低位，建议买入',
                'SELL': '估值处于历史高位，建议卖出',
                'HOLD': '估值处于中性区域，建议持有观望'
            }
        }