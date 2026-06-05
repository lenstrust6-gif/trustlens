import json
import logging
from backend.pipeline.processing.groq_client import groq_chat

logger = logging.getLogger(__name__)


async def extract_themes(reviews: list[dict]) -> dict:
    """
    Extract top pros, cons, and spec sentiment tags from reviews.

    Returns:
        {
            "pros": [{"text": "...", "mentions": 5}, ...],
            "cons": [{"text": "...", "mentions": 3}, ...],
            "spec_tags": {"feature": "confirms|mixed|disputes", ...}
        }
    """
    if not reviews:
        return {"pros": [], "cons": [], "spec_tags": {}}

    review_strs = []
    for i, review in enumerate(reviews):
        review_strs.append(f"{i}. {review.get('text', '')[:400]}")

    prompt = f"""Extract themes from these {len(reviews)} reviews.

Return JSON with:
- pros: top 3 positive themes with mention counts
- cons: top 3 negative themes with mention counts
- spec_tags: sentiment per spec/feature ("confirms", "mixed", or "disputes")

Format:
{{
  "pros": [{{"text": "Great battery life", "mentions": 8}}],
  "cons": [{{"text": "Heavy", "mentions": 3}}],
  "spec_tags": {{"battery": "confirms", "weight": "disputes"}}
}}

Reviews:
{chr(10).join(review_strs)}"""

    try:
        response = await groq_chat(prompt)
        data = json.loads(response)

        result = {
            "pros": data.get("pros", []),
            "cons": data.get("cons", []),
            "spec_tags": data.get("spec_tags", {}),
        }

        logger.info(f"Extracted {len(result['pros'])} pros, {len(result['cons'])} cons")
        return result
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse theme response: {e}")
        return {"pros": [], "cons": [], "spec_tags": {}}
    except Exception as e:
        logger.error(f"Theme extraction failed: {e}")
        return {"pros": [], "cons": [], "spec_tags": {}}
