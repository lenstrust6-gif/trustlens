import logging
from backend.config import settings
from anthropic import Anthropic

logger = logging.getLogger(__name__)

anthropic_client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None

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
    Write a 80-120 word verdict using Claude Sonnet.

    Fallback to Groq Gemma if Claude fails or if SUMMARY_MODEL=gemma.
    """
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

    # Use Claude Sonnet (Groq models keep getting deprecated, so we removed the fallback)
    if anthropic_client:
        try:
            response = anthropic_client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=256,
                messages=[{"role": "user", "content": prompt}],
            )
            verdict = response.content[0].text
            word_count = len(verdict.split())
            logger.info(f"Verdict written via Claude Sonnet ({word_count} words)")
            return verdict
        except Exception as e:
            logger.error(f"Claude Sonnet failed: {e}")

    logger.error("Claude Sonnet API not configured")
    return f"TrustLens verdict pending for {product_name}. Check back soon."
