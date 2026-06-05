import httpx
import logging
from backend.pipeline.ingestion.base import AmazonDataProvider
from backend.config import settings

logger = logging.getLogger(__name__)


class RainforestProvider(AmazonDataProvider):
    """Rainforest API implementation for Amazon reviews."""

    BASE_URL = "https://api.rainforestapi.com/request"

    async def get_reviews(self, asin: str, locale: str) -> list[dict]:
        """Fetch reviews from Rainforest API."""
        if not settings.rainforest_api_key:
            logger.warning("Rainforest API key not configured")
            return []

        amazon_domain = self._get_amazon_domain(locale)
        params = {
            "api_key": settings.rainforest_api_key,
            "type": "reviews",
            "asin": asin,
            "amazon_domain": amazon_domain,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
                reviews = data.get("reviews", [])
                logger.info(f"Rainforest: fetched {len(reviews)} reviews for {asin}")
                return self._normalize_reviews(reviews)
        except httpx.TimeoutException:
            logger.error(f"Rainforest API timeout for {asin}")
            return []
        except httpx.RequestError as e:
            logger.error(f"Rainforest API error: {e}")
            return []

    async def resolve_asin(self, product_name: str, locale: str) -> str | None:
        """Resolve product name to ASIN via search."""
        if not settings.rainforest_api_key:
            logger.warning("Rainforest API key not configured")
            return None

        amazon_domain = self._get_amazon_domain(locale)
        params = {
            "api_key": settings.rainforest_api_key,
            "type": "search",
            "search_term": product_name,
            "amazon_domain": amazon_domain,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
                results = data.get("search_results", [])
                if results:
                    asin = results[0].get("asin")
                    logger.info(f"Rainforest: resolved '{product_name}' to {asin}")
                    return asin
                logger.info(f"Rainforest: no ASIN found for '{product_name}'")
                return None
        except httpx.TimeoutException:
            logger.error(f"Rainforest API timeout for '{product_name}'")
            return None
        except httpx.RequestError as e:
            logger.error(f"Rainforest API error: {e}")
            return None

    def _get_amazon_domain(self, locale: str) -> str:
        domains = {"in": "amazon.in", "us": "amazon.com", "uk": "amazon.co.uk"}
        return domains.get(locale, "amazon.in")

    def _normalize_reviews(self, reviews: list[dict]) -> list[dict]:
        """Normalize Rainforest review format to internal format."""
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
