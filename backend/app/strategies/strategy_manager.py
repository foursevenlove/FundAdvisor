"""
策略管理器 - 统一管理所有投资策略
"""
from typing import Dict, List, Optional
import pandas as pd
from .base_strategy import BaseStrategy, StrategySignal
from .ma_cross_strategy import MACrossStrategy
from .dynamic_dca_strategy import DynamicDCAStrategy
from .trend_following_strategy import TrendFollowingStrategy
from ..core.config import settings


class StrategyManager:
    """策略管理器"""
    
    def __init__(self):
        self.strategies: Dict[str, BaseStrategy] = {}
        self._initialize_strategies()
    
    def _initialize_strategies(self):
        """初始化所有策略"""
        # 从配置中获取策略参数
        strategy_config = settings.STRATEGY_CONFIG
        
        # 初始化移动均线交叉策略
        self.strategies['ma_cross'] = MACrossStrategy(
            strategy_config.get('ma_cross', {})
        )
        
        # 初始化动态定投策略
        self.strategies['dynamic_dca'] = DynamicDCAStrategy(
            strategy_config.get('dynamic_dca', {})
        )
        
        # 初始化趋势跟踪策略
        self.strategies['trend_following'] = TrendFollowingStrategy(
            strategy_config.get('trend_following', {})
        )
    
    def get_strategy(self, strategy_name: str) -> Optional[BaseStrategy]:
        """
        获取指定策略
        
        Args:
            strategy_name: 策略名称
            
        Returns:
            策略实例或None
        """
        return self.strategies.get(strategy_name)
    
    def get_all_strategies(self) -> Dict[str, BaseStrategy]:
        """获取所有策略"""
        return self.strategies.copy()
    
    def calculate_signal(self, strategy_name: str, data: pd.DataFrame) -> Optional[StrategySignal]:
        """
        计算指定策略的信号
        
        Args:
            strategy_name: 策略名称
            data: 净值数据
            
        Returns:
            策略信号或None
        """
        strategy = self.get_strategy(strategy_name)
        if not strategy:
            return None
        
        return strategy.calculate_signal(data)
    
    def calculate_all_signals(self, data: pd.DataFrame) -> Dict[str, StrategySignal]:
        """
        计算所有策略的信号
        
        Args:
            data: 净值数据
            
        Returns:
            所有策略信号字典
        """
        signals = {}
        
        for name, strategy in self.strategies.items():
            try:
                signal = strategy.calculate_signal(data)
                signals[name] = signal
            except Exception as e:
                # 记录错误但不中断其他策略计算
                print(f"策略 {name} 计算失败: {e}")
                continue
        
        return signals
    
    def get_strategy_descriptions(self) -> Dict[str, dict]:
        """
        获取所有策略的描述信息
        
        Returns:
            策略描述字典
        """
        descriptions = {}
        
        for name, strategy in self.strategies.items():
            try:
                descriptions[name] = strategy.get_strategy_description()
            except Exception as e:
                print(f"获取策略 {name} 描述失败: {e}")
                descriptions[name] = {
                    'name': name,
                    'description': '策略描述获取失败',
                    'error': str(e)
                }
        
        return descriptions
    
    def get_consensus_signal(self, data: pd.DataFrame, 
                           strategy_weights: Dict[str, float] = None) -> StrategySignal:
        """
        获取综合策略信号（多策略加权平均）
        
        Args:
            data: 净值数据
            strategy_weights: 策略权重字典，默认等权重
            
        Returns:
            综合策略信号
        """
        # 默认等权重
        if not strategy_weights:
            strategy_weights = {name: 1.0 for name in self.strategies.keys()}
        
        # 计算所有策略信号
        all_signals = self.calculate_all_signals(data)
        
        if not all_signals:
            from .base_strategy import SignalType
            return StrategySignal(
                SignalType.HOLD,
                0.0,
                "无可用策略信号"
            )
        
        # 统计各类型信号的加权强度
        buy_weight = 0.0
        sell_weight = 0.0
        hold_weight = 0.0
        total_weight = 0.0
        
        signal_details = []
        
        for name, signal in all_signals.items():
            weight = strategy_weights.get(name, 0.0)
            if weight <= 0:
                continue
            
            total_weight += weight
            
            if signal.signal_type.value == 'BUY':
                buy_weight += weight * signal.strength
                signal_details.append(f"{name}:买入({signal.strength:.2f})")
            elif signal.signal_type.value == 'SELL':
                sell_weight += weight * signal.strength
                signal_details.append(f"{name}:卖出({signal.strength:.2f})")
            else:
                hold_weight += weight
                signal_details.append(f"{name}:持有")
        
        if total_weight == 0:
            from .base_strategy import SignalType
            return StrategySignal(
                SignalType.HOLD,
                0.0,
                "所有策略权重为零"
            )
        
        # 标准化权重
        buy_weight /= total_weight
        sell_weight /= total_weight
        hold_weight /= total_weight
        
        # 决定最终信号
        from .base_strategy import SignalType
        
        if buy_weight > sell_weight and buy_weight > 0.3:
            final_signal = SignalType.BUY
            final_strength = buy_weight
            reason = f"综合策略偏向买入 (买入强度:{buy_weight:.2f}, 卖出强度:{sell_weight:.2f})"
        elif sell_weight > buy_weight and sell_weight > 0.3:
            final_signal = SignalType.SELL
            final_strength = sell_weight
            reason = f"综合策略偏向卖出 (买入强度:{buy_weight:.2f}, 卖出强度:{sell_weight:.2f})"
        else:
            final_signal = SignalType.HOLD
            final_strength = 0.0
            reason = f"综合策略建议持有 (买入强度:{buy_weight:.2f}, 卖出强度:{sell_weight:.2f})"
        
        # 添加详细信息
        if signal_details:
            reason += f" | 策略详情: {', '.join(signal_details)}"
        
        # 构建综合指标
        indicators = {
            'buy_weight': round(buy_weight, 4),
            'sell_weight': round(sell_weight, 4),
            'hold_weight': round(hold_weight, 4),
            'total_strategies': len(all_signals),
            'active_strategies': len([s for s in all_signals.values() if s.strength > 0]),
            'strategy_details': {name: signal.to_dict() for name, signal in all_signals.items()}
        }
        
        return StrategySignal(
            signal_type=final_signal,
            strength=final_strength,
            reason=reason,
            indicators=indicators
        )
    
    def add_strategy(self, name: str, strategy: BaseStrategy):
        """
        添加新策略
        
        Args:
            name: 策略名称
            strategy: 策略实例
        """
        self.strategies[name] = strategy
    
    def remove_strategy(self, name: str) -> bool:
        """
        移除策略
        
        Args:
            name: 策略名称
            
        Returns:
            是否成功移除
        """
        if name in self.strategies:
            del self.strategies[name]
            return True
        return False
    
    def update_strategy_config(self, name: str, config: dict) -> bool:
        """
        更新策略配置
        
        Args:
            name: 策略名称
            config: 新配置
            
        Returns:
            是否成功更新
        """
        if name not in self.strategies:
            return False
        
        # 重新初始化策略
        strategy_class = type(self.strategies[name])
        self.strategies[name] = strategy_class(config)
        
        return True


# 创建全局策略管理器实例
strategy_manager = StrategyManager()