"""Filter service for product search and filtering."""
from typing import TypedDict
import logging

logger = logging.getLogger(__name__)


# Mock product database
MOCK_PRODUCTS = [
    {
        "id": "boat-airdopes-141",
        "name": "boAt Airdopes 141",
        "category": "tws-earbuds",
        "locale": "in",
        "trust_score": 8.3,
        "confidence_tier": "established",
        "auth_score_avg": 74.5,
        "youtube_count": 42,
        "amazon_count": 38,
        "source": "both",
    },
    {
        "id": "noise-colorfitpro4",
        "name": "Noise ColorFit Pro 4",
        "category": "smartwatches",
        "locale": "in",
        "trust_score": 7.9,
        "confidence_tier": "established",
        "auth_score_avg": 76.2,
        "youtube_count": 35,
        "amazon_count": 42,
        "source": "both",
    },
    {
        "id": "mi-power-bank-3i",
        "name": "Mi Power Bank 3i",
        "category": "power-banks",
        "locale": "in",
        "trust_score": 8.1,
        "confidence_tier": "established",
        "auth_score_avg": 75.8,
        "youtube_count": 48,
        "amazon_count": 45,
        "source": "both",
    },
]


class FilterService:
    """Service for filtering and sorting products."""

    @staticmethod
    def get_filter_stats(locale: str = "in", category: str | None = None) -> dict:
        """Get available filter options from mock data."""
        products = MOCK_PRODUCTS
        if category:
            products = [p for p in products if p["category"] == category]

        if not products:
            return {
                "trust_score_range": [0.0, 10.0],
                "auth_score_range": [0, 100],
                "sources": [],
                "confidence_tiers": [],
                "categories": [],
                "total_products": 0,
            }

        # Calculate ranges
        trust_scores = [p["trust_score"] for p in products]
        auth_scores = [p["auth_score_avg"] for p in products]

        trust_min = min(trust_scores) if trust_scores else 0.0
        trust_max = max(trust_scores) if trust_scores else 10.0
        auth_min = min(auth_scores) if auth_scores else 0
        auth_max = max(auth_scores) if auth_scores else 100

        # Count by tier
        tier_counts = {}
        for p in products:
            tier = p["confidence_tier"]
            tier_counts[tier] = tier_counts.get(tier, 0) + 1

        # Count by category
        cat_counts = {}
        for p in products:
            cat = p["category"]
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        # Count by source
        youtube_count = sum(1 for p in products if p["youtube_count"] > 0)
        amazon_count = sum(1 for p in products if p["amazon_count"] > 0)

        return {
            "trust_score_range": [round(trust_min, 1), round(trust_max, 1)],
            "auth_score_range": [auth_min, auth_max],
            "sources": [
                {"label": "YouTube", "value": "youtube", "count": youtube_count},
                {"label": "Amazon", "value": "amazon", "count": amazon_count},
            ],
            "confidence_tiers": [
                {"label": "Early", "value": "early", "count": tier_counts.get("early", 0)},
                {"label": "Growing", "value": "growing", "count": tier_counts.get("growing", 0)},
                {"label": "Established", "value": "established", "count": tier_counts.get("established", 0)},
                {"label": "Mature", "value": "mature", "count": tier_counts.get("mature", 0)},
            ],
            "categories": [
                {"label": cat.replace("-", " ").title(), "value": cat, "count": count}
                for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1])
            ],
            "total_products": len(products),
        }

    @staticmethod
    def filter_products(filters: dict) -> list[dict]:
        """Filter products based on filter parameters."""
        products = MOCK_PRODUCTS

        # Filter by trust score
        trust_min = filters.get("trust_score_min", 0.0)
        trust_max = filters.get("trust_score_max", 10.0)
        products = [p for p in products if trust_min <= p["trust_score"] <= trust_max]

        # Filter by auth score
        auth_min = filters.get("auth_score_min", 0)
        products = [p for p in products if p["auth_score_avg"] >= auth_min]

        # Filter by source
        source = filters.get("source", "all")
        if source == "youtube":
            products = [p for p in products if p["youtube_count"] > 0]
        elif source == "amazon":
            products = [p for p in products if p["amazon_count"] > 0]

        # Filter by confidence tier
        confidence_tiers = filters.get("confidence_tiers", [])
        if confidence_tiers:
            products = [p for p in products if p["confidence_tier"] in confidence_tiers]

        # Filter by category
        category = filters.get("category")
        if category:
            products = [p for p in products if p["category"] == category]

        # Sort
        sort_by = filters.get("sort_by", "score")
        if sort_by == "score":
            products = sorted(products, key=lambda p: -p["trust_score"])
        elif sort_by == "name":
            products = sorted(products, key=lambda p: p["name"])

        # Pagination
        offset = filters.get("offset", 0)
        limit = filters.get("limit", 20)
        products = products[offset : offset + limit]

        return products
