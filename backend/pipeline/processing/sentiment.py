import logging
import re

logger = logging.getLogger(__name__)

# Category features per CLAUDE.md
CATEGORY_FEATURES = {
    "tws-earbuds": [
        "sound_quality", "battery_life", "comfort_fit", "anc_quality",
        "call_quality", "connectivity", "value_for_money", "build_quality",
    ],
    "wireless-headphones": [
        "anc_quality", "sound_quality", "comfort", "battery_life",
        "call_quality", "value_for_money", "build_quality", "portability",
    ],
    "smartwatches": [
        "battery_life", "display_quality", "fitness_tracking", "build_quality",
        "app_ecosystem", "comfort", "value_for_money",
    ],
}

# Heuristic sentiment keywords
FEATURE_KEYWORDS = {
    "sound_quality": {
        "positive": ["crisp", "clear", "excellent sound", "amazing sound", "great bass", "punchy", "immersive"],
        "negative": ["muffled", "dull sound", "weak bass", "tinny", "poor sound", "muddy"],
    },
    "battery_life": {
        "positive": ["long battery", "lasts all day", "great battery", "extended battery", "goes days"],
        "negative": ["drains fast", "poor battery", "doesn't last", "dies quickly", "short battery"],
    },
    "comfort_fit": {
        "positive": ["comfortable", "fits well", "secure fit", "lightweight", "ergonomic", "snug"],
        "negative": ["uncomfortable", "loose fit", "falls out", "hurts ears", "heavy", "awkward fit"],
    },
    "anc_quality": {
        "positive": ["excellent anc", "blocks noise", "good noise cancellation", "isolating", "quiet"],
        "negative": ["weak anc", "poor noise cancellation", "doesn't block noise", "hissing"],
    },
    "build_quality": {
        "positive": ["premium build", "solid construction", "durable", "well-built", "sturdy", "feels premium"],
        "negative": ["cheap plastic", "feels cheap", "fragile", "breaks easily", "poor quality", "plastic"],
    },
    "value_for_money": {
        "positive": ["great value", "worth the price", "good deal", "amazing price", "best value"],
        "negative": ["overpriced", "not worth it", "expensive", "poor value", "waste of money"],
    },
    "display_quality": {
        "positive": ["bright display", "crisp screen", "vibrant colors", "sharp display", "clear screen"],
        "negative": ["dim display", "blurry", "poor colors", "hard to see", "low brightness"],
    },
    "connectivity": {
        "positive": ["fast connection", "stable", "reliable", "instant pairing", "smooth pairing"],
        "negative": ["disconnects", "unstable", "lag", "connection issues", "drops often"],
    },
}


def _analyze_feature_sentiment(reviews: list[dict], feature: str) -> dict:
    """Analyze sentiment for a single feature using keyword matching."""
    result = {"positive": 0, "negative": 0, "neutral": 0}

    if feature not in FEATURE_KEYWORDS:
        return result

    keywords = FEATURE_KEYWORDS.get(feature, {})
    pos_keywords = keywords.get("positive", [])
    neg_keywords = keywords.get("negative", [])

    for review in reviews:
        text = review.get("text", "").lower()

        pos_matches = sum(1 for kw in pos_keywords if kw in text)
        neg_matches = sum(1 for kw in neg_keywords if kw in text)

        if pos_matches > neg_matches:
            result["positive"] += 1
        elif neg_matches > pos_matches:
            result["negative"] += 1
        else:
            result["neutral"] += 1

    result["total"] = len(reviews)
    return result


async def analyse_sentiment(reviews: list[dict], category: str) -> dict[str, dict]:
    """
    Analyse sentiment per feature (heuristic-based, fast, free).

    Returns: {feature_name: {positive: int, negative: int, neutral: int, total: int}}
    """
    if not reviews:
        return {}

    features = CATEGORY_FEATURES.get(category, [])
    if not features:
        logger.warning(f"Unknown category '{category}', returning empty sentiment")
        return {}

    result = {}
    for feature in features:
        result[feature] = _analyze_feature_sentiment(reviews, feature)

    logger.info(f"Analysed sentiment for {len(features)} features (heuristic-based)")
    return result
