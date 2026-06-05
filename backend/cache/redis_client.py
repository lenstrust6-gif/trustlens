import json
import logging
from redis.asyncio import from_url
from slugify import slugify
from backend.config import settings

logger = logging.getLogger(__name__)

VERDICT_TTL = 259200  # 72 hours
SEARCH_TTL = 86400  # 24 hours
CATEGORY_TTL = 21600  # 6 hours

redis_client = None


async def init_redis():
    global redis_client
    redis_client = await from_url(settings.redis_url, decode_responses=True)


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()


def verdict_key(locale: str, slug: str) -> str:
    return f"verdict:{locale}:{slug}"


def category_key(locale: str, category: str) -> str:
    return f"category:{locale}:{category}"


def search_key(locale: str, query: str) -> str:
    return f"search:{locale}:{slugify(query)}"


async def get_verdict(locale: str, slug: str) -> dict | None:
    key = verdict_key(locale, slug)
    try:
        data = await redis_client.get(key)
        if data:
            logger.info(f"Cache hit: {key}")
            return json.loads(data)
        logger.info(f"Cache miss: {key}")
        return None
    except Exception as e:
        logger.error(f"Redis get error: {e}")
        return None


async def set_verdict(locale: str, slug: str, data: dict) -> bool:
    key = verdict_key(locale, slug)
    try:
        await redis_client.setex(key, VERDICT_TTL, json.dumps(data))
        logger.info(f"Cache set: {key} (TTL: {VERDICT_TTL}s)")
        return True
    except Exception as e:
        logger.error(f"Redis set error: {e}")
        return False


async def get_category(locale: str, category: str) -> dict | None:
    key = category_key(locale, category)
    try:
        data = await redis_client.get(key)
        if data:
            logger.info(f"Cache hit: {key}")
            return json.loads(data)
        logger.info(f"Cache miss: {key}")
        return None
    except Exception as e:
        logger.error(f"Redis get error: {e}")
        return None


async def set_category(locale: str, category: str, data: dict) -> bool:
    key = category_key(locale, category)
    try:
        await redis_client.setex(key, CATEGORY_TTL, json.dumps(data))
        logger.info(f"Cache set: {key} (TTL: {CATEGORY_TTL}s)")
        return True
    except Exception as e:
        logger.error(f"Redis set error: {e}")
        return False


async def get_hit_rate() -> float:
    try:
        info = await redis_client.info()
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = hits + misses
        if total == 0:
            return 0.0
        return round(hits / total, 4)
    except Exception as e:
        logger.error(f"Redis info error: {e}")
        return 0.0
