"""
核心配置文件
"""
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import Optional, Union, List
import os


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用基础配置
    APP_NAME: str = "FundAdvisor API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API 配置
    API_V1_STR: str = "/api/v1"
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://foursevenlove:foursevenlove@localhost:5432/fundadvisor"
    
    # Redis 配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT 配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS 配置
    CORS_ORIGINS: List[str] = []

    @field_validator("CORS_ORIGINS", mode='before')
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v
    
    # akshare 数据更新配置
    DATA_UPDATE_INTERVAL: int = 300  # 5分钟更新一次

    # 调度器与更新任务配置（允许 .env 覆盖）
    SCHEDULER_ENABLED: bool = True
    UPDATE_HOST: str = "127.0.0.1"
    UPDATE_PORT: int = 8000
    UPDATE_TIMEOUT: int = 15
    UPDATE_CONCURRENCY: int = 8
    
    # 策略配置
    STRATEGY_CONFIG: dict = {
        "ma_cross": {
            "short_period": 5,
            "long_period": 20,
            "volume_threshold": 1.2
        },
        "dynamic_dca": {
            "low_percentile": 25,
            "high_percentile": 75,
            "lookback_days": 252
        },
        "trend_following": {
            "rsi_oversold": 30,
            "rsi_overbought": 70,
            "macd_fast": 12,
            "macd_slow": 26,
            "macd_signal": 9
        }
    }
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建全局配置实例
settings = Settings()
