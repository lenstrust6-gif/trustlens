import logging
import asyncio
import httpx
import os
from backend.config import settings

logger = logging.getLogger(__name__)

VERDICT_PROMPT_TEMPLATE = """You are writing a product verdict summary for TrustLens, an AI-powered product review intelligence portal for Indian consumers.

**Product:** {product_name}
**Category:** {category}
**TrustScore:** {trust_score}/10
**Reviews Analysed:** {review_count}

**Top Themes from Real Users:**
PROS: {pros_formatted}
CONS: {cons_formatted}

---

WRITE A FULL VERDICT OF EXACTLY 80–120 WORDS. This is critical.

RULES:
1. Start by stating what the product is genuinely good for
2. Then acknowledge its main weakness
3. State clearly who should buy it and who should avoid it
4. DO NOT mention TrustLens, review counts, or methodology
5. DO NOT use superlatives like "best ever"
6. Write conversational, plain English for Indian consumers
7. DO NOT call any review "fake" or "inauthentic"
8. OUTPUT ONLY THE PARAGRAPH – NO HEADING, NO PREAMBLE, NO MARKDOWN

IMPORTANT: Write the full 80-120 word verdict now."""


async def write_verdict(
    product_name: str,
    category: str,
    trust_score: float,
    pros: list[dict],
    cons: list[dict],
    review_count: int,
) -> str:
    """
    Write a 80-120 word verdict using Gemini REST API directly.
    """
    api_key = settings.google_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("Gemini API key not configured")
        return f"TrustLens verdict pending for {product_name}. Check back soon."

    pros_formatted = ", ".join([f"{p['text']} ({p['mentions']} mentions)" for p in pros[:3]])
    cons_formatted = ", ".join([f"{c['text']} ({c['mentions']} mentions)" for c in cons[:3]])

    prompt = VERDICT_PROMPT_TEMPLATE.format(
        product_name=product_name,
        category=category,
        trust_score=trust_score,
        review_count=review_count,
        pros_formatted=pros_formatted,
        cons_formatted=cons_formatted,
    )

    try:
        # Use v1 endpoint with AI Studio key directly
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent"

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        }

        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2000,
            }
        }

        logger.info(f"Calling Gemini API with model: gemini-3.5-flash, API key present: {bool(api_key)}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)

            logger.info(f"Gemini API response status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                logger.info(f"Gemini full response: {data}")
                verdict = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                logger.info(f"Extracted verdict: '{verdict}'")

                if verdict:
                    word_count = len(verdict.split())
                    logger.info(f"Verdict written via Gemini ({word_count} words)")
                    return verdict
            else:
                logger.error(f"Gemini API error status {response.status_code}: {response.text}")

    except Exception as e:
        logger.error(f"Gemini API exception: {e}")

    return f"TrustLens verdict pending for {product_name}. Check back soon."
