import json
import logging
from backend.pipeline.processing.groq_client import groq_chat

logger = logging.getLogger(__name__)

# Category features per CLAUDE.md
CATEGORY_FEATURES = {
    "tws-earbuds": [
        "sound_quality",
        "battery_life",
        "comfort_fit",
        "anc_quality",
        "call_quality",
        "connectivity",
        "value_for_money",
        "build_quality",
    ],
    "wireless-headphones": [
        "anc_quality",
        "sound_quality",
        "comfort",
        "battery_life",
        "call_quality",
        "value_for_money",
        "build_quality",
        "portability",
    ],
    "smartwatches": [
        "battery_life",
        "display_quality",
        "fitness_tracking",
        "build_quality",
        "app_ecosystem",
        "comfort",
        "value_for_money",
    ],
}


async def analyse_sentiment(reviews: list[dict], category: str) -> dict[str, dict]:
    """
    Analyse sentiment per feature for a set of reviews.

    Returns: {feature_name: {positive: int, negative: int, neutral: int, total: int}}
    """
    if not reviews:
        return {}

    features = CATEGORY_FEATURES.get(category, [])
    if not features:
        logger.warning(f"Unknown category '{category}', returning empty sentiment")
        return {}

    review_strs = []
    for i, review in enumerate(reviews):
        review_strs.append(f"{i}. {review.get('text', '')[:300]}")

    features_str = ", ".join(features)

    prompt = f"""Analyse sentiment for these reviews on these features: {features_str}

For each feature, count positive/negative/neutral mentions across all reviews.
Analyse regardless of language (English or Hindi).

Return JSON:
{{
  "feature_name": {{"positive": 3, "negative": 1, "neutral": 0}},
  ...
}}

Reviews:
{chr(10).join(review_strs)}"""

    try:
        response = await groq_chat(prompt)
        data = json.loads(response)

        # Ensure all features are present
        result = {}
        for feature in features:
            result[feature] = data.get(feature, {"positive": 0, "negative": 0, "neutral": 0})
            result[feature]["total"] = (
                result[feature].get("positive", 0)
                + result[feature].get("negative", 0)
                + result[feature].get("neutral", 0)
            )

        logger.info(f"Analysed sentiment for {len(features)} features")
        return result
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse sentiment response: {e}")
        return {}
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        return {}
