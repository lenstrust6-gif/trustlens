from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.cache import init_redis, close_redis
from backend.routes import health, search, products, submit, categories, admin, auth, ratings, quick_picks, filters, affiliate, users
from backend.workers.refresh_scheduler import refresh_stale_products
from backend.db.connection import _get_session_factory
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def refresh_job():
    """Background job to refresh stale product verdicts."""
    try:
        factory = _get_session_factory()
        if not factory:
            logger.error("Database not available for refresh job")
            return

        async with factory() as session:
            stats = await refresh_stale_products(session)
            logger.info(f"Refresh job complete: {stats}")
    except Exception as e:
        logger.error(f"Refresh job failed: {e}", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting TrustLens API ({settings.environment})")
    await init_redis()
    logger.info("Redis connected")

    # Start background scheduler for verdict generation
    try:
        # Run every 15 minutes (900 seconds)
        scheduler.add_job(refresh_job, 'interval', seconds=900, id='refresh-stale-verdicts')
        scheduler.start()
        logger.info("Verdict refresh scheduler started (every 15 minutes)")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}", exc_info=True)

    yield

    # Shutdown scheduler
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("Verdict refresh scheduler stopped")
    except Exception as e:
        logger.error(f"Failed to shutdown scheduler: {e}", exc_info=True)

    logger.info("Shutting down TrustLens API")
    await close_redis()


app = FastAPI(
    title="TrustLens API",
    description="AI-powered product review intelligence portal",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route registration
app.include_router(health.router)
app.include_router(search.router)
app.include_router(products.router)
app.include_router(submit.router)
app.include_router(categories.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(ratings.router)
app.include_router(quick_picks.router)
app.include_router(filters.router)
app.include_router(affiliate.router)
app.include_router(users.router)


@app.get("/")
async def root():
    return {"message": "TrustLens API v0.1.0"}
