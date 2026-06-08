from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.cache import init_redis, close_redis
from backend.routes import health, search, products, submit, categories, admin, auth, ratings, quick_picks, filters, affiliate, users
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting TrustLens API ({settings.environment})")
    await init_redis()
    logger.info("Redis connected")
    yield
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
