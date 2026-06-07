"""Filter models for search and verdict filtering."""
from pydantic import BaseModel, Field
from typing import Literal


class SearchFilters(BaseModel):
    """Search filters for product verdict queries."""

    # Score filters
    trust_score_min: float = Field(0.0, ge=0, le=10, description="Minimum TrustScore (0-10)")
    trust_score_max: float = Field(10.0, ge=0, le=10, description="Maximum TrustScore (0-10)")

    # Authenticity filter
    auth_score_min: int = Field(0, ge=0, le=100, description="Minimum Authenticity Score (0-100)")

    # Source filter
    source: Literal["all", "youtube", "amazon"] = Field("all", description="Data source filter")

    # Confidence tier filter
    confidence_tiers: list[str] = Field(
        default_factory=lambda: ["early", "growing", "established", "mature"],
        description="Confidence tiers to include"
    )

    # Category filter (optional)
    category: str | None = Field(None, description="Product category slug")

    # Sorting
    sort_by: Literal["score", "relevance", "newest"] = Field("score", description="Sort order")

    # Pagination
    limit: int = Field(20, ge=1, le=100, description="Number of results")
    offset: int = Field(0, ge=0, description="Pagination offset")

    class Config:
        json_schema_extra = {
            "example": {
                "trust_score_min": 7.5,
                "trust_score_max": 10.0,
                "auth_score_min": 70,
                "source": "all",
                "confidence_tiers": ["established", "mature"],
                "category": None,
                "sort_by": "score",
                "limit": 20,
                "offset": 0,
            }
        }


class FilterOption(BaseModel):
    """Individual filter option."""
    label: str
    value: str
    count: int = 0  # Number of products matching this filter


class FilterStats(BaseModel):
    """Statistics for available filters."""
    trust_score_range: tuple[float, float] = (0.0, 10.0)
    auth_score_range: tuple[int, int] = (0, 100)
    sources: list[FilterOption] = []
    confidence_tiers: list[FilterOption] = []
    categories: list[FilterOption] = []
    total_products: int = 0
