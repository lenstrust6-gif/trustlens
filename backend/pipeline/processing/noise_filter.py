import logging
import re

logger = logging.getLogger(__name__)

SPAM_PHRASES = [
    "buy now", "click here", "discount code", "affiliate link",
    "sponsored content", "brand ambassador", "free trial",
    "limited time offer", "act fast", "order now",
]


async def filter_noise(reviews: list[dict]) -> list[dict]:
    """
    Filter noisy/spam reviews (heuristic-based, fast, free).

    Removes: very short, all-emoji, gibberish patterns, obvious spam.
    """
    if not reviews:
        return []

    filtered = []
    for review in reviews:
        text = review.get("text", "").strip()

        # Too short
        if len(text) < 10:
            logger.debug(f"Filtered: too short ({len(text)} chars)")
            continue

        # All emoji/special chars (no alphanumeric)
        if not any(c.isalnum() for c in text):
            logger.debug("Filtered: emoji-only or gibberish")
            continue

        # Obvious spam patterns
        if any(spam in text.lower() for spam in SPAM_PHRASES):
            logger.debug("Filtered: spam phrase detected")
            continue

        # Excessive punctuation (!!!!!!!! or ????????)
        if re.search(r'([!?])\1{4,}', text):
            logger.debug("Filtered: excessive punctuation")
            continue

        filtered.append(review)

    logger.info(f"Filtered {len(reviews)} → {len(filtered)} reviews (heuristic-based)")
    return filtered
