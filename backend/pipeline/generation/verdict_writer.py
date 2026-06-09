import logging
import asyncio
import httpx
import os
from backend.config import settings

logger = logging.getLogger(__name__)

VERDICT_PROMPT_TEMPLATE = """You are writing a product verdict summary for TrustLens, an AI-powered
product review intelligence portal for Indian consumers.

Product: {product_name}
Category: {category}
TrustScore: {trust_score}/10
Reviews analysed: {review_count}

Top themes from real users:
PROS: {pros_formatted}
CONS: {cons_formatted}

Write a balanced, honest verdict of exactly 80–120 words.
Rules:
- Lead with what the product is genuinely good for
- Acknowledge the main weakness honestly
- State who should buy it and who should avoid it
- Do NOT mention TrustLens, review counts, or methodology
- Do NOT use superlatives like "best ever" or "worst ever"
- Write in plain English, not marketing language
- Do NOT call any review fake or inauthentic
- Output only the paragraph – no heading, no preamble
"""


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
                "maxOutputTokens": 200,
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)

            logger.info(f"Gemini API response status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                verdict = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()

                if verdict:
                    word_count = len(verdict.split())
                    logger.info(f"Verdict written via Gemini ({word_count} words)")
                    return verdict
            else:
                logger.error(f"Gemini API error status {response.status_code}: {response.text}")

    except Exception as e:
        logger.error(f"Gemini API exception: {e}")

    return f"TrustLens verdict pending for {product_name}. Check back soon."
