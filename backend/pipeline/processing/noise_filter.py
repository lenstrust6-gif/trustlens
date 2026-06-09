import json
import logging
from backend.pipeline.processing.groq_client import groq_chat

logger = logging.getLogger(__name__)


async def filter_noise(reviews: list[dict]) -> list[dict]:
    """
    Filter noisy/spam reviews using Groq Gemma.

    Removes: < 10 chars, emoji-only, likely duplicates/spam.

    Returns filtered list with source field preserved.
    """
    if not reviews:
        return []

    # Pre-filter: remove very short reviews (minimum 3 chars to catch real feedback)
    pre_filtered = [r for r in reviews if len(r.get("text", "")) >= 3]

    if not pre_filtered:
        logger.info("All reviews filtered out (too short)")
        return []

    if len(pre_filtered) <= 50:
        # Single batch
        filtered = await _filter_batch(pre_filtered)
        return filtered

    # Multiple batches
    all_filtered = []
    for i in range(0, len(pre_filtered), 50):
        batch = pre_filtered[i : i + 50]
        filtered = await _filter_batch(batch)
        all_filtered.extend(filtered)

    logger.info(f"Filtered {len(reviews)} → {len(all_filtered)} reviews")
    return all_filtered


async def _filter_batch(reviews: list[dict]) -> list[dict]:
    """Filter a single batch of up to 50 reviews."""
    review_strs = []
    for i, review in enumerate(reviews):
        review_strs.append(f"{i}. {review.get('text', '')[:300]}")

    prompt = f"""Identify SPAM/NOISE reviews that should be EXCLUDED.
Exclude if:
- Gibberish, emoji-only, or incoherent
- Obvious vendor/astroturf content
- Duplicate or near-identical to another

Return JSON: {{"exclude_indices": [0, 3, 5]}}

Reviews (0-indexed):
{chr(10).join(review_strs)}"""

    try:
        response = await groq_chat(prompt)
        if not response:
            logger.warning("Groq returned empty response, keeping all reviews")
            return reviews

        data = json.loads(response)
        exclude_indices = set(data.get("exclude_indices", []))

        filtered = [r for i, r in enumerate(reviews) if i not in exclude_indices]
        logger.info(f"Filtered batch: {len(reviews)} → {len(filtered)}")
        return filtered
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse noise filter response: {e}, keeping all reviews")
        return reviews
    except Exception as e:
        logger.warning(f"Noise filtering failed: {e}, keeping all reviews as fallback")
        return reviews
