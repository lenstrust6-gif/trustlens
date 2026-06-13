"""Service to determine data sufficiency state for products."""
import logging

logger = logging.getLogger(__name__)

# Thresholds for different verdict states
THRESHOLDS = {
    "minimum_reviews_amazon": 5,      # Absolute minimum to start tracking
    "minimum_comments_youtube": 3,    # Absolute minimum to start tracking
    "minimum_combined": 25,           # Threshold for Early Verdict
    "full_verdict_combined": 75,      # Threshold for Full Verdict
}

# Display states
STATE_COMING_SOON = "coming_soon"      # < 25 combined
STATE_EARLY_VERDICT = "early_verdict"   # 25-74 combined
STATE_FULL_VERDICT = "full_verdict"     # 75+ combined
STATE_INSUFFICIENT = "insufficient"     # Product exists but no data yet


def calculate_data_sufficiency(
    amazon_reviews: int,
    youtube_comments: int,
) -> dict:
    """
    Calculate data sufficiency state for a product.

    Returns:
    {
        "state": "coming_soon" | "early_verdict" | "full_verdict" | "insufficient",
        "combined_count": int,
        "progress_percent": float (0-100),
        "need_for_early": int (if not yet reached),
        "need_for_full": int (if not yet reached),
        "can_generate_verdict": bool,
        "show_warning": bool,
    }
    """
    combined = amazon_reviews + youtube_comments

    # Insufficient data
    if combined < THRESHOLDS["minimum_combined"]:
        return {
            "state": STATE_COMING_SOON,
            "combined_count": combined,
            "progress_percent": min((combined / THRESHOLDS["minimum_combined"]) * 100, 100),
            "need_for_early": THRESHOLDS["minimum_combined"] - combined,
            "need_for_full": THRESHOLDS["full_verdict_combined"] - combined,
            "can_generate_verdict": False,
            "show_warning": False,
            "message": f"Collecting reviews... {combined}/{THRESHOLDS['minimum_combined']} data points",
        }

    # Early verdict (limited data)
    if combined < THRESHOLDS["full_verdict_combined"]:
        return {
            "state": STATE_EARLY_VERDICT,
            "combined_count": combined,
            "progress_percent": (combined / THRESHOLDS["full_verdict_combined"]) * 100,
            "need_for_full": THRESHOLDS["full_verdict_combined"] - combined,
            "can_generate_verdict": True,
            "show_warning": True,
            "message": f"Early verdict based on {combined} data points. More reviews coming.",
        }

    # Full verdict
    return {
        "state": STATE_FULL_VERDICT,
        "combined_count": combined,
        "progress_percent": 100,
        "can_generate_verdict": True,
        "show_warning": False,
        "message": f"Full verdict based on {combined} data points",
    }


def get_display_state(amazon_reviews: int, youtube_comments: int) -> str:
    """Get simple display state string."""
    sufficiency = calculate_data_sufficiency(amazon_reviews, youtube_comments)
    return sufficiency["state"]


def can_generate_verdict(amazon_reviews: int, youtube_comments: int) -> bool:
    """Check if we have enough data to generate a verdict."""
    sufficiency = calculate_data_sufficiency(amazon_reviews, youtube_comments)
    return sufficiency["can_generate_verdict"]


def should_show_warning(amazon_reviews: int, youtube_comments: int) -> bool:
    """Check if verdict should display a warning badge."""
    sufficiency = calculate_data_sufficiency(amazon_reviews, youtube_comments)
    return sufficiency["show_warning"]
