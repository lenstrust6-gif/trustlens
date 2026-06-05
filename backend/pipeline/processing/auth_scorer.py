import json
import logging
from backend.pipeline.processing.groq_client import groq_chat

logger = logging.getLogger(__name__)

# Thresholds (never called "fake")
EXCLUDE = 40  # < 40: exclude from verdict
REDUCED_WEIGHT = 60  # 40-59: 0.5x weight
FULL_WEIGHT = 60  # 60+: 1.0x weight
HIGHLIGHT = 80  # 80+: eligible for Review Highlights


async def score_authenticity_batch(reviews: list[dict]) -> list[dict]:
    """
    Score authenticity for a batch of reviews using Groq Gemma.

    Returns reviews with auth_score (0-100) added to each.
    """
    if not reviews:
        return []

    # Build batch prompt
    review_strs = []
    for i, review in enumerate(reviews):
        review_strs.append(f"{i}. {review.get('text', '')[:500]}")

    prompt = f"""Analyse the authenticity of these {len(reviews)} reviews.
For each review, score 0-100 based on:
- Specificity (30%): named features, numbers, model numbers, specific use cases
- Credibility (25%): reviewer account history signals, category diversity
- Coherence (20%): sentiment matches stated rating
- Timing (15%): not part of a review burst (50+ in 7 days)
- Uniqueness (10%): not duplicate across platforms (cosine similarity)

Return ONLY valid JSON array:
[{{"index": 0, "auth_score": 85}}, {{"index": 1, "auth_score": 42}}, ...]

Reviews:
{chr(10).join(review_strs)}"""

    try:
        response = await groq_chat(prompt)
        data = json.loads(response)

        # Apply scores to reviews
        scored = list(reviews)  # Copy
        for entry in data:
            idx = entry.get("index", -1)
            if 0 <= idx < len(scored):
                scored[idx]["auth_score"] = entry.get("auth_score", 50)

        # Fill missing scores with 50 (default)
        for review in scored:
            if "auth_score" not in review:
                review["auth_score"] = 50

        logger.info(f"Scored {len(scored)} reviews for authenticity")
        return scored
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Groq response: {e}")
        return reviews
    except Exception as e:
        logger.error(f"Authenticity scoring failed: {e}")
        return reviews


def apply_thresholds(reviews: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Apply authenticity thresholds: exclude < 40, reduce weight 40-59, full weight 60+.

    Returns:
        (qualifying_reviews, all_reviews_with_weights)
    """
    qualifying = []
    for review in reviews:
        score = review.get("auth_score", 50)
        if score >= EXCLUDE:
            review["auth_weight"] = 0.5 if score < FULL_WEIGHT else 1.0
            if score >= HIGHLIGHT:
                review["highlight_eligible"] = True
            qualifying.append(review)

    return qualifying, reviews
