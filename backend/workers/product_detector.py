"""Background worker to detect new products from Amazon.in and add to staging queue."""
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import _get_session_factory
from backend.db import repositories as repos
from backend.config import settings
import httpx

logger = logging.getLogger(__name__)

# Amazon.in URLs to monitor for new releases
DETECTION_SOURCES = {
    "amazon_new_releases_electronics": "https://www.amazon.in/gp/new-releases/electronics",
    "amazon_new_releases_computers": "https://www.amazon.in/gp/new-releases/computers",
    "amazon_movers_shakers": "https://www.amazon.in/gp/movers-and-shakers/electronics",
}

# Category mapping from Amazon URLs to our internal categories
CATEGORY_MAPPING = {
    "Headphones": "wireless-headphones",
    "Earbuds": "tws-earbuds",
    "Speakers": "bluetooth-speakers",
    "Smartwatches": "smartwatches",
    "Smart Bands": "smartbands",
    "Power Banks": "power-banks",
    "Smartphones": "smartphones",
    "Laptops": "laptops",
    "Cameras": "cameras",
    "Tablets": "tablets",
}


async def detect_new_products():
    """
    Runs daily to detect new products from Amazon.in.
    Fetches new releases and movers-shakers.
    Adds qualifying products to staging_queue.
    """
    logger.info("🔍 Starting product detection...")

    if not settings.rainforest_api_key:
        logger.warning("⚠️ Rainforest API key not configured. Skipping detection.")
        return {"status": "skipped", "reason": "no_api_key"}

    factory = _get_session_factory()
    if not factory:
        logger.error("❌ Database not available for product detection")
        return {"status": "error", "reason": "no_database"}

    detected_count = 0
    duplicate_count = 0
    error_count = 0

    async with factory() as session:
        for source_name, url in DETECTION_SOURCES.items():
            try:
                logger.info(f"📍 Checking {source_name}...")
                products = await fetch_amazon_products(url)

                if not products:
                    logger.warning(f"   No products found for {source_name}")
                    continue

                logger.info(f"   Found {len(products)} products, checking for duplicates...")

                for product in products[:50]:  # Limit to top 50 per source
                    try:
                        asin = product.get("asin")
                        if not asin:
                            continue

                        # Check if already in database
                        existing_product = await repos.products.get_by_asin(session, asin, "in")
                        if existing_product:
                            logger.debug(f"   Skip: {product['title']} (already in products)")
                            duplicate_count += 1
                            continue

                        # Check if already in staging queue
                        existing_staging = await repos.staging_queue.get_by_asin(session, asin, "in")
                        if existing_staging:
                            logger.debug(f"   Skip: {product['title']} (already in staging)")
                            duplicate_count += 1
                            continue

                        # Determine category
                        category = map_category(product.get("category", ""))

                        # Create staging queue entry
                        staging_item = await repos.staging_queue.create(
                            session,
                            name=product.get("title", "Unknown Product"),
                            asin=asin,
                            category=category,
                            brand=product.get("brand", ""),
                            locale="in",
                            source=source_name,
                            priority="normal",
                            notes=f"Detected from {source_name} | Price: {product.get('price', 'N/A')}",
                        )

                        logger.info(f"   ✅ Added: {product['title']} ({asin})")
                        detected_count += 1

                        await session.commit()

                    except Exception as e:
                        logger.error(f"   ❌ Error processing product: {e}", exc_info=True)
                        error_count += 1
                        await session.rollback()
                        continue

            except Exception as e:
                logger.error(f"❌ Error detecting products from {source_name}: {e}", exc_info=True)
                error_count += 1
                continue

    result = {
        "status": "ok",
        "detected": detected_count,
        "duplicates": duplicate_count,
        "errors": error_count,
        "timestamp": datetime.utcnow().isoformat(),
    }

    logger.info(f"✅ Detection complete: {detected_count} new, {duplicate_count} duplicates, {error_count} errors")
    return result


async def fetch_amazon_products(url: str) -> list[dict]:
    """
    Fetch products from Amazon.in using Rainforest API.
    Returns list of products with: asin, title, brand, category, price.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.rainforestapi.com/request",
                params={
                    "api_key": settings.rainforest_api_key,
                    "type": "bestsellers",
                    "url": url,
                    "amazon_domain": "amazon.in",
                },
            )

            if response.status_code != 200:
                logger.warning(f"Rainforest API error {response.status_code}: {response.text}")
                return []

            data = response.json()

            # Extract products from bestsellers section
            products = []
            if "bestsellers" in data:
                for item in data["bestsellers"]:
                    products.append({
                        "asin": item.get("asin"),
                        "title": item.get("title"),
                        "brand": item.get("brand"),
                        "category": data.get("metadata", {}).get("category", "Electronics"),
                        "price": item.get("price", {}).get("raw"),
                        "rating": item.get("rating"),
                    })

            return products

    except Exception as e:
        logger.error(f"Error fetching from Rainforest API: {e}", exc_info=True)
        return []


def map_category(amazon_category: str) -> str:
    """
    Map Amazon category names to our internal category slugs.
    Falls back to 'power-banks' if no match found.
    """
    if not amazon_category:
        return "power-banks"

    amazon_cat_lower = amazon_category.lower()

    # Exact matches
    for key, value in CATEGORY_MAPPING.items():
        if key.lower() in amazon_cat_lower:
            return value

    # Partial matches
    if "earbud" in amazon_cat_lower or "ear" in amazon_cat_lower:
        return "tws-earbuds"
    if "headphone" in amazon_cat_lower:
        return "wireless-headphones"
    if "speaker" in amazon_cat_lower:
        return "bluetooth-speakers"
    if "watch" in amazon_cat_lower:
        return "smartwatches"
    if "band" in amazon_cat_lower:
        return "smartbands"
    if "phone" in amazon_cat_lower or "mobile" in amazon_cat_lower:
        return "smartphones"
    if "laptop" in amazon_cat_lower or "notebook" in amazon_cat_lower:
        return "laptops"
    if "camera" in amazon_cat_lower:
        return "cameras"
    if "tablet" in amazon_cat_lower:
        return "tablets"
    if "power" in amazon_cat_lower or "battery" in amazon_cat_lower or "bank" in amazon_cat_lower:
        return "power-banks"

    # Default
    return "power-banks"


async def update_staging_review_counts():
    """
    Update review counts for items in staging queue.
    Runs every 6 hours to refresh data before approval.
    """
    logger.info("🔄 Updating staging queue review counts...")

    if not settings.rainforest_api_key:
        logger.warning("⚠️ Rainforest API key not configured. Skipping update.")
        return {"status": "skipped"}

    factory = _get_session_factory()
    if not factory:
        logger.error("❌ Database not available")
        return {"status": "error"}

    updated_count = 0
    error_count = 0

    async with factory() as session:
        # Get all pending staging items with ASINs
        staging_items = await repos.staging_queue.get_pending_editorial(session)

        for item in staging_items:
            if not item.asin:
                continue

            try:
                # Fetch current product data
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(
                        "https://api.rainforestapi.com/request",
                        params={
                            "api_key": settings.rainforest_api_key,
                            "type": "product",
                            "asin": item.asin,
                            "amazon_domain": "amazon.in",
                        },
                    )

                    if response.status_code != 200:
                        error_count += 1
                        continue

                    data = response.json()
                    product = data.get("product", {})

                    # Extract review counts
                    review_count = product.get("rating_breakdown", {}).get("total_reviews", 0)

                    # Update staging item
                    if review_count > item.review_count_amazon:
                        await repos.staging_queue.update_review_counts(
                            session,
                            str(item.id),
                            amazon_count=review_count,
                        )
                        updated_count += 1
                        await session.commit()
                        logger.info(f"   ✅ Updated {item.name}: {review_count} reviews")

            except Exception as e:
                logger.error(f"Error updating {item.name}: {e}")
                error_count += 1
                continue

    logger.info(f"✅ Update complete: {updated_count} items refreshed, {error_count} errors")
    return {
        "status": "ok",
        "updated": updated_count,
        "errors": error_count,
    }
