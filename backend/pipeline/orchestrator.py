import asyncio
import logging
from decimal import Decimal
from slugify import slugify
from sqlalchemy.ext.asyncio import AsyncSession
from backend.config import settings
from backend.pipeline.ingestion.youtube import youtube_fetcher
from backend.pipeline.ingestion.rainforest import RainforestProvider
from backend.pipeline.ingestion.oxylabs import OxylabsProvider
from backend.pipeline.processing.noise_filter import filter_noise
from backend.pipeline.processing.auth_scorer import score_authenticity_batch, apply_thresholds
from backend.pipeline.processing.sentiment import analyse_sentiment
from backend.pipeline.processing.theme_extractor import extract_themes
from backend.pipeline.generation.score_calculator import calculate_trust_score
from backend.pipeline.generation.verdict_writer import write_verdict
from backend.pipeline.generation.verdict_assembler import assemble_verdict_card
from backend.cache import set_verdict
from backend.db import repositories as repos

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


def _detect_category(product_name: str) -> str:
    """Detect product category from name."""
    name = product_name.lower()
    if any(w in name for w in ["watch", "band", "smartwatch"]):
        return "smartwatches"
    if any(w in name for w in ["headphone", "over-ear", "on-ear"]):
        return "wireless-headphones"
    if any(w in name for w in ["speaker", "portable"]):
        return "bluetooth-speakers"
    if any(w in name for w in ["power bank", "powerbank", "20000"]):
        return "power-banks"
    return "tws-earbuds"


async def run_pipeline(
    product_name: str,
    locale: str,
    session: AsyncSession,
) -> dict | None:
    """
    Full pipeline: fetch → process → generate verdict → persist.

    Returns VerdictCard dict or None if no data found.
    """
    slug = slugify(product_name)
    category = _detect_category(product_name)

    logger.info(f"Pipeline START: {product_name} ({locale}, {category})")

    # Step 1: Fetch raw data
    raw_data = await fetch_raw_data(product_name, locale)
    if not raw_data["fetch_ok"]:
        logger.warning(f"Pipeline ABORT: no data for {product_name}")
        return None

    # Step 2: Combine + filter noise
    combined = raw_data["youtube_comments"] + raw_data["amazon_reviews"]
    filtered = await filter_noise(combined)
    logger.info(f"Filtered: {len(combined)} → {len(filtered)} reviews")

    # Step 3: Score authenticity
    scored = await score_authenticity_batch(filtered)
    qualifying, all_scored = apply_thresholds(scored)
    excluded_count = len(combined) - len(qualifying)
    logger.info(f"Qualified: {len(qualifying)} reviews, excluded {excluded_count}")

    # Separate by source for TrustScore weighting
    amazon_q = [r for r in qualifying if r.get("source") == "amazon"]
    youtube_q = [r for r in qualifying if r.get("source") == "youtube"]

    # Step 4: Sentiment analysis
    sentiment = await analyse_sentiment(qualifying, category)

    # Step 5: Theme extraction
    themes = await extract_themes(qualifying)

    # Step 6: Calculate TrustScore
    trust_score, confidence_tier = calculate_trust_score(amazon_q, youtube_q)

    # Step 7: Write verdict summary
    summary = await write_verdict(
        product_name,
        category,
        trust_score,
        themes.get("pros", []),
        themes.get("cons", []),
        len(qualifying),
    )

    # Step 8: Calculate average auth score
    auth_scores = [r.get("auth_score", 50) for r in qualifying if "auth_score" in r]
    auth_score_avg = sum(auth_scores) / len(auth_scores) if auth_scores else 50.0

    # Step 9: Assemble verdict card
    verdict_card = assemble_verdict_card(
        product_name=product_name,
        slug=slug,
        locale=locale,
        category=category,
        trust_score=trust_score,
        confidence_tier=confidence_tier,
        summary=summary,
        pros=themes.get("pros", []),
        cons=themes.get("cons", []),
        spec_tags=themes.get("spec_tags", {}),
        sentiment=sentiment,
        qualifying_reviews=qualifying,
        source_count_yt=len(youtube_q),
        source_count_amz=len(amazon_q),
        auth_score_avg=auth_score_avg,
        excluded_count=excluded_count,
    )

    # Step 10: Persist to database
    try:
        # Create/get product
        product = await repos.products.get_by_slug(session, slug, locale)
        if not product:
            product = await repos.products.create(
                session,
                name=product_name,
                slug=slug,
                locale=locale,
                category=category,
            )

        # Create verdict
        verdict = await repos.verdicts.create(
            session,
            product_id=product.id,
            trust_score=Decimal(str(trust_score)),
            summary=summary,
            pros=themes.get("pros", []),
            cons=themes.get("cons", []),
            best_for=verdict_card.get("bestFor", []),
            avoid_if=verdict_card.get("avoidIf", []),
            feature_scores=verdict_card.get("featureScores", {}),
            spec_tags=themes.get("spec_tags", {}),
            confidence_tier=confidence_tier,
            source_count_yt=len(youtube_q),
            source_count_amz=len(amazon_q),
            auth_score_avg=Decimal(str(round(auth_score_avg, 1))),
            reviews_excluded=excluded_count,
        )

        await session.commit()
        logger.info(f"Verdict persisted: {product.id}")
    except Exception as e:
        logger.error(f"Failed to persist verdict: {e}")
        await session.rollback()

    # Step 11: Cache in Redis
    try:
        await set_verdict(locale, slug, verdict_card)
        logger.info(f"Verdict cached: {locale}/{slug}")
    except Exception as e:
        logger.error(f"Failed to cache verdict: {e}")

    logger.info(f"Pipeline COMPLETE: {product_name} (score: {trust_score})")
    return verdict_card
