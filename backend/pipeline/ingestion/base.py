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
