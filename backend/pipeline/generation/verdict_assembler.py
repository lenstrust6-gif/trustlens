import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def assemble_verdict_card(
    product_name: str,
    slug: str,
    locale: str,
    category: str,
    trust_score: float,
    confidence_tier: str,
    summary: str,
    pros: list[dict],
    cons: list[dict],
    spec_tags: dict[str, str],
    sentiment: dict,
    qualifying_reviews: list[dict],
    source_count_yt: int,
    source_count_amz: int,
    auth_score_avg: float,
    excluded_count: int,
) -> dict:
    """
    Assemble full VerdictCard from all AI-processed components.

    Returns:
        {
            "product": {...},
            "trustScore": float,
            "confidenceTier": str,
            "summary": str,
            "pros": [...],
            "cons": [...],
            "bestFor": [...],
            "avoidIf": [...],
            "specTags": {...},
            "featureScores": {...},
            "reviewHighlights": [...],
            "sourcePanel": {...},
            "alternatives": [],
            "locale": str,
        }
    """
    # Derive feature scores from sentiment
    feature_scores = _derive_feature_scores(sentiment)

    # Derive best-for / avoid-if profiles
    best_for = _derive_best_for(pros, category)
    avoid_if = _derive_avoid_if(cons, category)

    # Select top 3 review highlights (auth_score >= 80)
    review_highlights = _select_highlights(qualifying_reviews)

    verdict_card = {
        "product": {
            "name": product_name,
            "slug": slug,
            "category": category,
            "locale": locale,
        },
        "trustScore": trust_score,
        "confidenceTier": confidence_tier,
        "summary": summary,
        "pros": pros[:3],  # Top 3 only
        "cons": cons[:3],  # Top 3 only
        "bestFor": best_for,
        "avoidIf": avoid_if,
        "specTags": spec_tags,
        "featureScores": feature_scores,
        "reviewHighlights": review_highlights,
        "sourcePanel": {
            "youtubeCount": source_count_yt,
            "amazonCount": source_count_amz,
            "authScoreAvg": round(auth_score_avg, 1),
            "excludedCount": excluded_count,
            "lastRefreshed": datetime.utcnow().isoformat() + "Z",
        },
        "alternatives": [],  # Week 5+
        "locale": locale,
    }

    logger.info(f"VerdictCard assembled for {product_name} (score: {trust_score})")
    return verdict_card


def _derive_feature_scores(sentiment: dict[str, dict]) -> dict[str, float]:
    """Convert sentiment counts to feature scores (0.0-10.0)."""
    feature_scores = {}
    for feature, counts in sentiment.items():
        positive = counts.get("positive", 0)
        negative = counts.get("negative", 0)
        neutral = counts.get("neutral", 0)
        total = positive + negative + neutral

        if total == 0:
            score = 5.0  # Neutral default
        else:
            # Weighted: positive fully counts, neutral half, negative negative
            weighted = (positive * 1.0) + (neutral * 0.5) - (negative * 1.0)
            score = 5.0 + (weighted / total) * 5.0  # Scale to 0-10

        feature_scores[feature] = round(max(0.0, min(10.0, score)), 1)

    return feature_scores


def _derive_best_for(pros: list[dict], category: str) -> list[str]:
    """Map top pros to user profiles."""
    if not pros:
        return []

    # Simple keyword-based mapping
    keyword_map = {
        "battery": "All-day users",
        "sound": "Music lovers",
        "comfort": "Comfort seekers",
        "price": "Budget-conscious",
        "value": "Value hunters",
        "quality": "Quality enthusiasts",
        "durability": "Heavy-use professionals",
        "connectivity": "Multi-device users",
    }

    matched_profiles = set()
    for pro in pros[:3]:
        text = pro.get("text", "").lower()
        for keyword, profile in keyword_map.items():
            if keyword in text:
                matched_profiles.add(profile)
                if len(matched_profiles) >= 3:
                    break
        if len(matched_profiles) >= 3:
            break

    # Fallback defaults if no matches
    if not matched_profiles:
        if "budget" in category.lower() or "earbuds" in category.lower():
            matched_profiles = {"Daily commuters", "Budget buyers", "Casual listeners"}
        else:
            matched_profiles = {"Everyday users", "Music enthusiasts", "Active lifestyles"}

    return list(matched_profiles)[:3]


def _derive_avoid_if(cons: list[dict], category: str) -> list[str]:
    """Map top cons to counter-profiles."""
    if not cons:
        return []

    # Simple keyword-based mapping (opposite of bestFor)
    keyword_map = {
        "battery": "Heavy-use power users",
        "sound": "Audiophiles",
        "comfort": "Sensitive-ear users",
        "price": "Premium buyers",
        "quality": "Quality purists",
        "durability": "Rugged-use needs",
        "connectivity": "Seamless-switch users",
    }

    matched_profiles = set()
    for con in cons[:3]:
        text = con.get("text", "").lower()
        for keyword, profile in keyword_map.items():
            if keyword in text:
                matched_profiles.add(profile)
                if len(matched_profiles) >= 3:
                    break
        if len(matched_profiles) >= 3:
            break

    return list(matched_profiles)[:3]


def _select_highlights(reviews: list[dict]) -> list[dict]:
    """Select top 3 review highlights (auth_score >= 80, sorted by score desc)."""
    highlights = [r for r in reviews if r.get("auth_score", 0) >= 80]
    highlights.sort(key=lambda r: r.get("auth_score", 0), reverse=True)

    return [
        {
            "source": r.get("source", "unknown"),
            "text": r.get("text", "")[:300],  # Truncate to 300 chars
            "rating": r.get("rating", 0),
            "authScore": r.get("auth_score", 0),
        }
        for r in highlights[:3]
    ]
