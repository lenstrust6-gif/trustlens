import httpx
import logging
import base64
from backend.pipeline.ingestion.base import AmazonDataProvider
from backend.config import settings

logger = logging.getLogger(__name__)


class OxylabsProvider(AmazonDataProvider):
    """Oxylabs API implementation for Amazon reviews (fallback provider)."""

    BASE_URL = "https://realtime.oxylabs.io/v1/queries"

    async def get_reviews(self, asin: str, locale: str) -> list[dict]:
        """Fetch reviews from Oxylabs API."""
        if not settings.oxylabs_username or not settings.oxylabs_password:
            logger.warning("Oxylabs credentials not configured")
            return []

        amazon_url = self._get_amazon_url(asin, locale)

        payload = {
            "source": "amazon",
            "url": amazon_url,
            "parse": True,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    auth=(settings.oxylabs_username, settings.oxylabs_password),
                )
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [{}])[0]
                reviews = results.get("content", {}).get("reviews", [])
                logger.info(f"Oxylabs: fetched {len(reviews)} reviews for {asin}")
                return self._normalize_reviews(reviews)
        except httpx.TimeoutException:
            logger.error(f"Oxylabs API timeout for {asin}")
            return []
        except httpx.RequestError as e:
            logger.error(f"Oxylabs API error: {e}")
            return []

    async def resolve_asin(self, product_name: str, locale: str) -> str | None:
        """Resolve product name to ASIN via search."""
        if not settings.oxylabs_username or not settings.oxylabs_password:
            logger.warning("Oxylabs credentials not configured")
            return None

        amazon_domain = self._get_amazon_domain(locale)
        search_url = f"https://{amazon_domain}/s?k={product_name}"

        payload = {
            "source": "amazon",
            "url": search_url,
            "parse": True,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    auth=(settings.oxylabs_username, settings.oxylabs_password),
                )
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [{}])[0]
                products = results.get("content", {}).get("results", [])
                if products:
                    asin = products[0].get("asin")
                    logger.info(f"Oxylabs: resolved '{product_name}' to {asin}")
                    return asin
                logger.info(f"Oxylabs: no ASIN found for '{product_name}'")
                return None
        except httpx.TimeoutException:
            logger.error(f"Oxylabs API timeout for '{product_name}'")
            return None
        except httpx.RequestError as e:
            logger.error(f"Oxylabs API error: {e}")
            return None

    def _get_amazon_domain(self, locale: str) -> str:
        domains = {"in": "amazon.in", "us": "amazon.com", "uk": "amazon.co.uk"}
        return domains.get(locale, "amazon.in")

    def _get_amazon_url(self, asin: str, locale: str) -> str:
        domain = self._get_amazon_domain(locale)
        return f"https://{domain}/dp/{asin}"

    def _normalize_reviews(self, reviews: list[dict]) -> list[dict]:
        """Normalize Oxylabs review format to internal format."""
        normalized = []
        for review in reviews:
            normalized.append(
                {
                    "text": review.get("body", ""),
                    "rating": review.get("rating", 0),
                    "verified": review.get("verified_purchase", False),
                    "helpful_count": review.get("helpful_votes", 0),
                    "date": review.get("review_date", ""),
                }
            )
        return normalized
