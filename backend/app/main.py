"""
FundAdvisor FastAPI 应用主文件
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import engine, Base
from .api.v1 import api_router
import os
from datetime import datetime
import asyncio
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from .core.database import SessionLocal
from .models import Fund


# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("启动 FundAdvisor API 服务...")
    logger.info("API 前缀: %s | root_path: %s", settings.API_V1_STR, getattr(app, "root_path", "/"))
    
    # 创建数据库表
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功")
    except Exception as e:
        logger.error(f"数据库表创建失败: {e}")
    
    # 初始化策略管理器
    try:
        from .strategies import strategy_manager
        logger.info(f"策略管理器初始化成功，加载策略: {list(strategy_manager.get_all_strategies().keys())}")
    except Exception as e:
        logger.error(f"策略管理器初始化失败: {e}")

    # 启动调度器（工作日00:00，通过HTTP调用更新数据）
    # 使用 Settings 管理的环境变量
    scheduler_enabled = settings.SCHEDULER_ENABLED
    if scheduler_enabled:
        host = settings.UPDATE_HOST
        port = str(settings.UPDATE_PORT)
        api_prefix = settings.API_V1_STR
        BASE_URL = f"http://{host}:{port}{api_prefix}/funds"
        UPDATE_TIMEOUT = float(settings.UPDATE_TIMEOUT)
        CONCURRENCY = int(settings.UPDATE_CONCURRENCY)

        async def _post_update_for_code(client: httpx.AsyncClient, fund_code: str) -> bool:
            url = f"{BASE_URL}/{fund_code}/update-data"
            try:
                resp = await client.post(url, timeout=UPDATE_TIMEOUT)
                if resp.status_code == 200:
                    return True
                logger.warning(f"Update failed {fund_code}: status={resp.status_code} body={resp.text[:200]}")
                return False
            except Exception as e:
                logger.warning(f"Update exception {fund_code}: {e}")
                return False

        async def _run_daily_updates() -> None:
            # 避开周末 (0=周一, 6=周日)
            today = datetime.now()
            if today.weekday() >= 5:
                logger.info("Scheduler: 周末跳过基金更新")
                return

            # 读取现有全部基金代码
            db = SessionLocal()
            try:
                codes = [row[0] for row in db.query(Fund.code).all()]
            finally:
                db.close()

            if not codes:
                logger.info("Scheduler: 没有基金需要更新")
                return

            success = 0
            fail = 0
            sem = asyncio.Semaphore(CONCURRENCY)

            async with httpx.AsyncClient() as client:
                async def worker(code: str):
                    nonlocal success, fail
                    async with sem:
                        ok = await _post_update_for_code(client, code)
                        if ok:
                            success += 1
                        else:
                            fail += 1

                tasks = [asyncio.create_task(worker(code)) for code in codes]
                await asyncio.gather(*tasks)

            logger.info(f"Scheduler: 更新完成 total={len(codes)} success={success} fail={fail}")

        scheduler = AsyncIOScheduler()
        trigger = CronTrigger(day_of_week="mon-fri", hour=0, minute=0)
        scheduler.add_job(_run_daily_updates, trigger, id="daily_fund_updates", replace_existing=True)
        scheduler.start()
        logger.info("Scheduler 启动：工作日 00:00 执行基金更新任务")

    yield
    
    # 关闭时执行
    logger.info("关闭 FundAdvisor API 服务...")


# 创建 FastAPI 应用实例
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="智能基金投资顾问 API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 全局异常处理器
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP 异常处理"""
    logger.error(
        "HTTPException: %s %s -> status=%s detail=%s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理"""
    logger.exception(
        "Unhandled exception: %s %s -> %s", request.method, request.url.path, exc
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "服务器内部错误",
            "status_code": 500
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """请求体验证异常处理"""
    logger.error(
        "Validation error: %s %s -> errors=%s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "message": "请求参数验证失败",
            "details": exc.errors(),
            "status_code": 422,
        },
    )


# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG
    }


# 根路径
@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "欢迎使用 FundAdvisor API",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "health_check": "/health"
    }


# 包含 API 路由
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
