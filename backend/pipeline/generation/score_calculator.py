import logging
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger(__name__)


def calculate_trust_score(amazon_reviews: list[dict], youtube_comments: list[dict]) -> tuple[float, str]:
    """
    Calculate weighted TrustScore (0.0-10.0) from Amazon + YouTube reviews.

    Weights:
    - Amazon: 45% (verified_purchase = 1.5x)
    - YouTube: 35% (dedicated review = 2.0x)
    - Auth adjustment: 20%

    Time weighting: max(0.25, 1.0 - (age_months / 24) * 0.75)

    Returns:
        (trust_score: float, confidence_tier: str)
    """
    amazon_score = _score_amazon(amazon_reviews)
    youtube_score = _score_youtube(youtube_comments)
    auth_adj = _auth_adjustment(amazon_reviews + youtube_comments)

    trust_score = (amazon_score * 0.45) + (youtube_score * 0.35) + (auth_adj * 0.20)
    trust_score = max(0.0, min(10.0, trust_score))  # Clamp 0.0-10.0

    total_count = len(amazon_reviews) + len(youtube_comments)
    if total_count < 25:
        tier = "early"
    elif total_count < 100:
        tier = "growing"
    elif total_count < 500:
        tier = "established"
    else:
        tier = "mature"

    logger.info(f"TrustScore: {trust_score:.1f} ({tier} tier, {total_count} reviews)")
    return round(trust_score, 1), tier


def _score_amazon(reviews: list[dict]) -> float:
    """Score Amazon reviews (0-10)."""
    if not reviews:
        return 0.0

    total_weight = 0.0
    total_score = 0.0

    for review in reviews:
        rating = review.get("rating", 3.0)
        verified = review.get("verified", False)
        helpful = review.get("helpful_count", 0)
        auth_score = review.get("auth_score", 50)
        auth_weight = review.get("auth_weight", 1.0)

        # Verified = 1.5x, unverified = 1.0x
        v_weight = 1.5 if verified else 1.0

        # Time weight
        date_str = review.get("date", "")
        age_months = _get_age_months(date_str)
        t_weight = max(0.25, 1.0 - (age_months / 24) * 0.75)

        # Helpful weight (soft boost)
        h_weight = min(1.5, 1.0 + (helpful / 50.0))

        weight = v_weight * t_weight * auth_weight * h_weight
        total_weight += weight
        total_score += (rating / 5.0) * 10.0 * weight

    return total_score / total_weight if total_weight > 0 else 0.0


def _score_youtube(comments: list[dict]) -> float:
    """Score YouTube comments (0-10)."""
    if not comments:
        return 0.0

    total_weight = 0.0
    total_score = 0.0

    for comment in comments:
        text = comment.get("text", "")
        like_count = comment.get("like_count", 0)
        auth_score = comment.get("auth_score", 50)
        auth_weight = comment.get("auth_weight", 1.0)

        # Dedicated review = 2.0x, casual = 1.0x
        is_dedicated = _is_dedicated_review(text)
        d_weight = 2.0 if is_dedicated else 1.0

        # Time weight
        date_str = comment.get("published_at", "")
        age_months = _get_age_months(date_str)
        t_weight = max(0.25, 1.0 - (age_months / 24) * 0.75)

        # Like weight
        l_weight = min(2.0, 1.0 + (like_count / 100.0))

        # Estimate sentiment from text (rough heuristic)
        sentiment_score = _estimate_sentiment(text)

        weight = d_weight * t_weight * auth_weight * l_weight
        total_weight += weight
        total_score += sentiment_score * weight

    return total_score / total_weight if total_weight > 0 else 0.0


def _auth_adjustment(reviews: list[dict]) -> float:
    """Auth adjustment score (0-10)."""
    if not reviews:
        return 5.0

    scores = [r.get("auth_score", 50) for r in reviews]
    avg_score = sum(scores) / len(scores) if scores else 50
    return (avg_score / 100.0) * 10.0


def _get_age_months(date_str: str) -> int:
    """Calculate months since date string."""
    if not date_str:
        return 0
    try:
        review_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        age = (datetime.utcnow() - review_date).days / 30
        return int(age)
    except (ValueError, TypeError) as e:
        logger.warning(f"Failed to parse date '{date_str}': {e}")
        return 0


def _is_dedicated_review(text: str) -> bool:
    """Heuristic: is this a dedicated product review (not casual mention)?"""
    text_lower = text.lower()
    indicators = [
        "review",
        "product",
        "recommend",
        "honest",
        "unboxing",
        "testing",
        "quality",
        "purchase",
    ]
    return sum(1 for ind in indicators if ind in text_lower) >= 2


def _estimate_sentiment(text: str) -> float:
    """Rough sentiment score 0-10 from text."""
    text_lower = text.lower()
    positive = sum(text_lower.count(w) for w in ["great", "excellent", "amazing", "love", "perfect", "best"])
    negative = sum(text_lower.count(w) for w in ["bad", "poor", "terrible", "worst", "hate", "awful"])
    score = 5.0 + (positive - negative) * 0.5
    return max(0.0, min(10.0, score))
