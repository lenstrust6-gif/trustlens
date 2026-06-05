from abc import ABC, abstractmethod


class AmazonDataProvider(ABC):
    """Abstract interface for Amazon review providers."""

    @abstractmethod
    async def get_reviews(self, asin: str, locale: str) -> list[dict]:
        """
        Fetch reviews for a product ASIN.

        Returns:
            List of review dicts with keys: text, rating, verified, helpful_count, date
        """
        raise NotImplementedError

    @abstractmethod
    async def resolve_asin(self, product_name: str, locale: str) -> str | None:
        """
        Search for product name and return ASIN.

        Returns:
            ASIN string or None if not found
        """
        raise NotImplementedError

    async def get_reviews_by_name(self, product_name: str, locale: str) -> list[dict]:
        """
        Convenience method: resolve ASIN from product name, then fetch reviews.
        Returns empty list if ASIN not found or reviews fetch fails.
        """
        asin = await self.resolve_asin(product_name, locale)
        if not asin:
            return []
        return await self.get_reviews(asin, locale)
