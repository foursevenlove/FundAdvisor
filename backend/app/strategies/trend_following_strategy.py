
"""
趋势跟踪策略 (Trend Following Strategy)

策略逻辑：
1. 使用 MACD（平滑异同移动平均线）判断趋势方向
2. 使用 RSI（相对强弱指数）判断超买超卖状态
3. 结合布林带判断价格位置和波动率
4. 多重技术指标确认，提高信号准确性
"""
import pandas as pd
import numpy as np
from .base_strategy import BaseStrategy, StrategySignal, SignalType


class TrendFollowingStrategy(BaseStrategy):
    """趋势跟踪策略"""
    
    def __init__(self, config: dict = None):
        default_config = {
            'rsi_period': 14,        # RSI计算周期
            'rsi_oversold': 30,      # RSI超卖线
            'rsi_overbought': 70,    # RSI超买线
            'macd_fast': 12,         # MACD快线周期
            'macd_slow': 26,         # MACD慢线周期
            'macd_signal': 9,        # MACD信号线周期
            'bb_period': 20,         # 布林带周期
            'bb_std': 2,             # 布林带标准差倍数
            'min_data_points': 30    # 最少数据点数
        }
        
        if config:
            default_config.update(config)
            
        super().__init__("Trend_Following_Strategy", default_config)
    
    def calculate_signal(self, data: pd.DataFrame) -> StrategySignal:
        """
        计算趋势跟踪策略信号
        
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
        prices = data['net_value']
        
        # 计算技术指标
        rsi = self.calculate_rsi(prices, self.config['rsi_period'])
        macd_line, signal_line, histogram = self.calculate_macd(
            prices, 
            self.config['macd_fast'],
            self.config['macd_slow'],
            self.config['macd_signal']
        )
        upper_bb, middle_bb, lower_bb = self.calculate_bollinger_bands(
            prices,
            self.config['bb_period'],
            self.config['bb_std']
        )
        
        # 获取最新指标值
        current_rsi = rsi.iloc[-1] if not rsi.isna().iloc[-1] else 50
        current_macd = macd_line.iloc[-1] if not macd_line.isna().iloc[-1] else 0
        current_signal = signal_line.iloc[-1] if not signal_line.isna().iloc[-1] else 0
        current_histogram = histogram.iloc[-1] if not histogram.isna().iloc[-1] else 0
        current_price = prices.iloc[-1]
        current_upper_bb = upper_bb.iloc[-1]
        current_lower_bb = lower_bb.iloc[-1]
        current_middle_bb = middle_bb.iloc[-1]
        
        # 获取前一日指标值（用于判断交叉）
        if len(macd_line) >= 2:
            prev_macd = macd_line.iloc[-2] if not macd_line.isna().iloc[-2] else current_macd
            prev_signal = signal_line.iloc[-2] if not signal_line.isna().iloc[-2] else current_signal
        else:
            prev_macd = current_macd
            prev_signal = current_signal
        
        # 分析各个指标信号
        rsi_signal = self._analyze_rsi_signal(current_rsi)
        macd_signal = self._analyze_macd_signal(
            current_macd, current_signal, prev_macd, prev_signal, current_histogram
        )
        bb_signal = self._analyze_bollinger_signal(
            current_price, current_upper_bb, current_middle_bb, current_lower_bb
        )
        
        # 计算趋势强度
        trend_strength = self._calculate_trend_strength(data)
        
        # 综合信号分析
        signal_type, strength, reason = self._synthesize_signals(
            rsi_signal, macd_signal, bb_signal, trend_strength
        )
        
        # 构建技术指标数据
        indicators = {
            'rsi': round(current_rsi, 2),
            'macd': round(current_macd, 6),
            'macd_signal': round(current_signal, 6),
            'macd_histogram': round(current_histogram, 6),
            'bb_upper': round(current_upper_bb, 4),
            'bb_middle': round(current_middle_bb, 4),
            'bb_lower': round(current_lower_bb, 4),
            'bb_position': round((current_price - current_lower_bb) / 
                               (current_upper_bb - current_lower_bb) * 100, 2),
            'trend_strength': round(trend_strength, 4),
            'price_change_5d': round(self._calculate_price_change(prices, 5), 4),
            'volatility': round(self._calculate_volatility(data), 4)
        }
        
        return StrategySignal(
            signal_type=signal_type,
            strength=strength,
            reason=reason,
            indicators=indicators
        )
    
    def _analyze_rsi_signal(self, rsi: float) -> dict:
        """分析RSI信号"""
        if rsi <= self.config['rsi_oversold']:
            return {
                'type': 'BUY',
                'strength': (self.config['rsi_oversold'] - rsi) / self.config['rsi_oversold'],
                'reason': f'RSI({rsi:.1f})进入超卖区域'
            }
        elif rsi >= self.config['rsi_overbought']:
            return {
                'type': 'SELL',
                'strength': (rsi - self.config['rsi_overbought']) / (100 - self.config['rsi_overbought']),
                'reason': f'RSI({rsi:.1f})进入超买区域'
            }
        else:
            # 中性区域，根据偏向给出弱信号
            if rsi < 45:
                return {
                    'type': 'BUY',
                    'strength': (45 - rsi) / 15 * 0.3,
                    'reason': f'RSI({rsi:.1f})偏向超卖'
                }
            elif rsi > 55:
                return {
                    'type': 'SELL',
                    'strength': (rsi - 55) / 15 * 0.3,
                    'reason': f'RSI({rsi:.1f})偏向超买'
                }
            else:
                return {
                    'type': 'HOLD',
                    'strength': 0.0,
                    'reason': f'RSI({rsi:.1f})处于中性区域'
                }
    
    def _analyze_macd_signal(self, current_macd: float, current_signal: float,
                           prev_macd: float, prev_signal: float, histogram: float) -> dict:
        """分析MACD信号"""
        # 判断MACD线与信号线的交叉
        macd_cross_up = prev_macd <= prev_signal and current_macd > current_signal
        macd_cross_down = prev_macd >= prev_signal and current_macd < current_signal
        
        if macd_cross_up:
            # MACD上穿信号线，买入信号
            strength = min(abs(histogram) * 1000, 0.8) + 0.2  # 基于柱状图强度
            return {
                'type': 'BUY',
                'strength': strength,
                'reason': 'MACD线上穿信号线，趋势转强'
            }
        elif macd_cross_down:
            # MACD下穿信号线，卖出信号
            strength = min(abs(histogram) * 1000, 0.8) + 0.2
            return {
                'type': 'SELL',
                'strength': strength,
                'reason': 'MACD线下穿信号线，趋势转弱'
            }
        else:
            # 无交叉，根据当前位置判断
            if current_macd > current_signal:
                if histogram > 0:  # 柱状图为正且增长
                    return {
                        'type': 'BUY',
                        'strength': min(histogram * 500, 0.6),
                        'reason': 'MACD保持在信号线上方，趋势向好'
                    }
                else:
                    return {
                        'type': 'HOLD',
                        'strength': 0.0,
                        'reason': 'MACD在信号线上方但动能减弱'
                    }
            else:
                if histogram < 0:  # 柱状图为负且下降
                    return {
                        'type': 'SELL',
                        'strength': min(abs(histogram) * 500, 0.6),
                        'reason': 'MACD保持在信号线下方，趋势偏弱'
                    }
                else:
                    return {
                        'type': 'HOLD',
                        'strength': 0.0,
                        'reason': 'MACD在信号线下方但有企稳迹象'
                    }
    
    def _analyze_bollinger_signal(self, price: float, upper: float, 
                                middle: float, lower: float) -> dict:
        """分析布林带信号"""
        bb_width = upper - lower
        bb_position = (price - lower) / bb_width if bb_width > 0 else 0.5
        
        if price <= lower:
            # 价格触及或跌破下轨
            strength = min((lower - price) / lower * 100, 0.8) + 0.2
            return {
                'type': 'BUY',
                'strength': strength,
                'reason': '价格触及布林带下轨，可能超跌反弹'
            }
        elif price >= upper:
            # 价格触及或突破上轨
            strength = min((price - upper) / upper * 100, 0.8) + 0.2
            return {
                'type': 'SELL',
                'strength': strength,
                'reason': '价格触及布林带上轨，可能超涨回调'
            }
        else:
            # 价格在布林带内部
            if bb_position < 0.2:
                return {
                    'type': 'BUY',
                    'strength': (0.2 - bb_position) * 2,
                    'reason': f'价格接近布林带下轨({bb_position*100:.1f}%位置)'
                }
            elif bb_position > 0.8:
                return {
                    'type': 'SELL',
                    'strength': (bb_position - 0.8) * 2,
                    'reason': f'价格接近布林带上轨({bb_position*100:.1f}%位置)'
                }
            else:
                return {
                    'type': 'HOLD',
                    'strength': 0.0,
                    'reason': f'价格在布林带中部({bb_position*100:.1f}%位置)'
                }
    
    def _calculate_trend_strength(self, data: pd.DataFrame) -> float:
        """计算趋势强度"""
        prices = data['net_value']
        
        # 使用多个时间周期的移动平均线
        ma_5 = self.calculate_moving_average(prices, 5)
        ma_10 = self.calculate_moving_average(prices, 10)
        ma_20 = self.calculate_moving_average(prices, 20)
        
        current_price = prices.iloc[-1]
        current_ma5 = ma_5.iloc[-1]
        current_ma10 = ma_10.iloc[-1]
        current_ma20 = ma_20.iloc[-1]
        
        # 计算均线排列得分
        alignment_score = 0
        if current_price > current_ma5 > current_ma10 > current_ma20:
            alignment_score = 1.0  # 完美多头排列
        elif current_price < current_ma5 < current_ma10 < current_ma20:
            alignment_score = -1.0  # 完美空头排列
        else:
            # 部分排列
            scores = []
            if current_price > current_ma5:
                scores.append(0.4)
            else:
                scores.append(-0.4)
            
            if current_ma5 > current_ma10:
                scores.append(0.3)
            else:
                scores.append(-0.3)
            
            if current_ma10 > current_ma20:
                scores.append(0.3)
            else:
                scores.append(-0.3)
            
            alignment_score = sum(scores)
        
        # 计算价格动量
        if len(prices) >= 10:
            momentum = (current_price - prices.iloc[-10]) / prices.iloc[-10]
        else:
            momentum = 0
        
        # 综合趋势强度
        trend_strength = alignment_score * 0.7 + momentum * 10 * 0.3
        
        return max(-1.0, min(1.0, trend_strength))
    
    def _calculate_price_change(self, prices: pd.Series, days: int) -> float:
        """计算指定天数的价格变化率"""
        if len(prices) < days + 1:
            return 0.0
        
        current_price = prices.iloc[-1]
        past_price = prices.iloc[-(days + 1)]
        
        return (current_price - past_price) / past_price * 100
    
    def _calculate_volatility(self, data: pd.DataFrame) -> float:
        """计算波动率"""
        if 'daily_return' in data.columns:
            returns = data['daily_return'].tail(20).dropna()
        else:
            returns = data['net_value'].pct_change().tail(20).dropna() * 100
        
        return returns.std() if len(returns) > 1 else 0.0
    
    def _synthesize_signals(self, rsi_signal: dict, macd_signal: dict, 
                           bb_signal: dict, trend_strength: float) -> tuple:
        """
        综合多个技术指标信号
        
        Args:
            rsi_signal: RSI信号
            macd_signal: MACD信号
            bb_signal: 布林带信号
            trend_strength: 趋势强度
            
        Returns:
            (信号类型, 强度, 原因)
        """
        # 收集所有信号
        signals = [rsi_signal, macd_signal, bb_signal]
        
        # 统计各类型信号数量和强度
        buy_signals = [s for s in signals if s['type'] == 'BUY']
        sell_signals = [s for s in signals if s['type'] == 'SELL']
        hold_signals = [s for s in signals if s['type'] == 'HOLD']
        
        # 计算加权强度
        buy_strength = sum(s['strength'] for s in buy_signals)
        sell_strength = sum(s['strength'] for s in sell_signals)
        
        # 趋势强度调整
        if trend_strength > 0.3:
            buy_strength *= 1.2  # 强势上涨趋势增强买入信号
        elif trend_strength < -0.3:
            sell_strength *= 1.2  # 强势下跌趋势增强卖出信号
        
        # 决定最终信号
        if len(buy_signals) >= 2 or (len(buy_signals) == 1 and buy_strength > 0.6):
            # 多个买入信号或单个强买入信号
            final_strength = min(buy_strength / len(buy_signals) if buy_signals else 0, 1.0)
            
            # 构建原因
            reasons = [s['reason'] for s in buy_signals]
            if trend_strength > 0.3:
                reasons.append(f"整体趋势向好(强度{trend_strength:.2f})")
            
            return SignalType.BUY, final_strength, "; ".join(reasons)
            
        elif len(sell_signals) >= 2 or (len(sell_signals) == 1 and sell_strength > 0.6):
            # 多个卖出信号或单个强卖出信号
            final_strength = min(sell_strength / len(sell_signals) if sell_signals else 0, 1.0)
            
            # 构建原因
            reasons = [s['reason'] for s in sell_signals]
            if trend_strength < -0.3:
                reasons.append(f"整体趋势偏弱(强度{trend_strength:.2f})")
            
            return SignalType.SELL, final_strength, "; ".join(reasons)
            
        else:
            # 信号冲突或不明确
            if len(buy_signals) == len(sell_signals) and len(buy_signals) > 0:
                # 信号冲突
                reason = "技术指标信号冲突，建议观望等待明确方向"
            else:
                # 信号不足
                all_reasons = [s['reason'] for s in signals if s['strength'] > 0]
                if all_reasons:
                    reason = f"信号强度不足: {'; '.join(all_reasons)}"
                else:
                    reason = "各项技术指标均处于中性状态"
            
            return SignalType.HOLD, 0.0, reason
    
    def get_strategy_description(self) -> dict:
        """获取策略描述"""
        return {
            'name': self.name,
            'description': '趋势跟踪策略，综合使用RSI、MACD、布林带等多个技术指标判断趋势',
            'parameters': {
                'rsi_period': {
                    'value': self.config['rsi_period'],
                    'description': 'RSI计算周期'
                },
                'rsi_oversold': {
                    'value': self.config['rsi_oversold'],
                    'description': 'RSI超卖阈值'
                },
                'rsi_overbought': {
                    'value': self.config['rsi_overbought'],
                    'description': 'RSI超买阈值'
                },
                'macd_fast': {
                    'value': self.config['macd_fast'],
                    'description': 'MACD快线周期'
                },
                'macd_slow': {
                    'value': self.config['macd_slow'],
                    'description': 'MACD慢线周期'
                },
                'bb_period': {
                    'value': self.config['bb_period'],
                    'description': '布林带计算周期'
                }
            },
            'indicators': {
                'RSI': '相对强弱指数，判断超买超卖状态',
                'MACD': '平滑异同移动平均线，判断趋势方向',
                'Bollinger Bands': '布林带，判断价格位置和波动率'
            },
            'signals': {
                'BUY': '多个技术指标显示买入信号，趋势向好',
                'SELL': '多个技术指标显示卖出信号，趋势转弱',
                'HOLD': '技术指标信号冲突或不明确，建议观望'
            }
        }