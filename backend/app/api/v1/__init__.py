"""
API v1 路由模块
"""
from fastapi import APIRouter
from .endpoints import funds, strategies, watchlist, portfolio

api_router = APIRouter()

# 包含各个端点路由
api_router.include_router(funds.router, prefix="/funds", tags=["基金"])
api_router.include_router(strategies.router, prefix="/strategies", tags=["策略"])
api_router.include_router(watchlist.router, prefix="/watchlist", tags=["关注列表"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["投资组合"])
