import asyncio
import logging
from backend.config import settings
from backend.pipeline.ingestion.youtube import youtube_fetcher
from backend.pipeline.ingestion.rainforest import RainforestProvider
from backend.pipeline.ingestion.oxylabs import OxylabsProvider

logger = logging.getLogger(__name__)

# Provider selection
PROVIDER_MAP = {"rainforest": RainforestProvider, "oxylabs": OxylabsProvider}
amazon_provider = PROVIDER_MAP.get(settings.amazon_provider, RainforestProvider)()


async def fetch_with_fallback(fetch_fn, fallback=None, label=""):
    """
    Execute async fetch with timeout and error handling.
    Returns fallback list if timeout or error occurs.
    """
    if fallback is None:
        fallback = []

    try:
        return await asyncio.wait_for(fetch_fn(), timeout=10.0)
    except asyncio.TimeoutError:
        logger.warning(f"{label} timed out after 10s — using fallback")
        return fallback
    except Exception as e:
        logger.error(f"{label} failed: {e} — using fallback")
        return fallback


async def fetch_raw_data(product_name: str, locale: str) -> dict:
    """
    Fetch raw review data from YouTube and Amazon in parallel.

    Returns:
        {
            "youtube_comments": list[dict],
            "amazon_reviews": list[dict],
            "product_name": str,
            "locale": str,
            "fetch_ok": bool,  # True if at least one source has data
        }
    """
    logger.info(f"Fetching data for '{product_name}' (locale: {locale})")

    youtube_task = fetch_with_fallback(
        lambda: youtube_fetcher.fetch_comments(product_name, locale),
        fallback=[],
        label="YouTube",
    )

    amazon_task = fetch_with_fallback(
        lambda: amazon_provider.get_reviews_by_name(product_name, locale),
        fallback=[],
        label="Amazon",
    )

    youtube_comments, amazon_reviews = await asyncio.gather(youtube_task, amazon_task)

    fetch_ok = bool(youtube_comments or amazon_reviews)
    logger.info(
        f"Fetch complete for '{product_name}': YouTube {len(youtube_comments)}, "
        f"Amazon {len(amazon_reviews)}, OK: {fetch_ok}"
    )

    return {
        "youtube_comments": youtube_comments,
        "amazon_reviews": amazon_reviews,
        "product_name": product_name,
        "locale": locale,
        "fetch_ok": fetch_ok,
    }
