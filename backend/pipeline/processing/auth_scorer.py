import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# Thresholds (never called "fake")
EXCLUDE = 40  # < 40: exclude from verdict
REDUCED_WEIGHT = 60  # 40-59: 0.5x weight
FULL_WEIGHT = 60  # 60+: 1.0x weight
HIGHLIGHT = 80  # 80+: eligible for Review Highlights

# Heuristic-based 6-signal authenticity scorer (fast, free MVP)
INCENTIVE_PHRASES = [
    "received free", "for review", "as part of promotion", "sponsored",
    "in exchange for", "provided by brand", "brand ambassador", "got this for free"
]

POSITIVE_WORDS = ["good", "great", "excellent", "amazing", "perfect", "love", "best", "fantastic",
                  "awesome", "wonderful", "impressive", "happy", "satisfied", "recommend"]

NEGATIVE_WORDS = ["bad", "poor", "terrible", "awful", "waste", "disappointing", "broke",
                  "useless", "horrible", "defective", "cheap", "regret", "avoid"]


def _score_language_specificity(text: str) -> float:
    """Score 0-100 based on technical language, specific references, details."""
    score = 50

    # Model numbers, specs (GB, GHz, mAh, dB, W, etc.)
    if re.search(r'\b\d+(?:gb|mb|ghz|mah|w|db|lpm|hrs?|mins?)\b', text.lower()):
        score += 20

    # Feature mentions
    features = ['battery', 'sound', 'display', 'camera', 'performance', 'design', 'build',
                'connectivity', 'weight', 'size', 'charging', 'latency', 'processor']
    feature_count = sum(1 for f in features if f in text.lower())
    score += min(20, feature_count * 2)

    # Generic praise penalty
    generic_count = sum(text.lower().count(word) for word in ["good", "great", "nice", "best"])
    if generic_count > 3:
        score -= 15

    # Specific criticisms/durations
    if re.search(r'(lasted?|works?|lasted? for|working for) (\d+) (days?|weeks?|months?|years?)',
                 text.lower()):
        score += 15

    return min(100, max(0, score))


def _score_sentiment_coherence(text: str, rating: int) -> float:
    """Score coherence between sentiment and rating (0-100)."""
    score = 50

    text_lower = text.lower()
    pos_count = sum(text_lower.count(word) for word in POSITIVE_WORDS)
    neg_count = sum(text_lower.count(word) for word in NEGATIVE_WORDS)

    if rating >= 4 and neg_count > pos_count:
        score -= 30
    elif rating == 1 and pos_count > neg_count:
        score -= 30
    elif (rating >= 4 and pos_count > neg_count) or (rating <= 2 and neg_count > pos_count):
        score += 20

    return min(100, max(0, score))


def _score_review_length(text: str) -> float:
    """Sweet spot: 50-500 words."""
    word_count = len(text.split())

    if word_count < 10:
        return 10
    elif 20 <= word_count <= 500:
        return 100
    elif 500 < word_count <= 1000:
        return 70
    else:
        return 50


def _score_incentive_language(text: str) -> float:
    """Check for incentive phrases."""
    if any(phrase in text.lower() for phrase in INCENTIVE_PHRASES):
        return 40

    return 100


def _score_credibility(account_age_days: int = None, review_count: int = None,
                       category_diversity: int = None) -> float:
    """Score reviewer credibility."""
    score = 50

    if account_age_days:
        if account_age_days < 30:
            score -= 20
        elif account_age_days >= 180:
            score += 15

    if review_count:
        if review_count < 1:
            score -= 10
        elif review_count >= 10:
            score += 20

    if category_diversity and category_diversity >= 5:
        score += 15

    return min(100, max(0, score))


def score_review(review_text: str, rating: int, account_age_days: int = None,
                 review_count: int = None, category_diversity: int = None) -> int:
    """Score single review authenticity (0-100) using heuristic 6-signal model."""
    if not review_text or len(review_text.strip()) < 10:
        return 20

    weighted = (
        _score_language_specificity(review_text) * 0.30 +
        _score_credibility(account_age_days, review_count, category_diversity) * 0.25 +
        _score_sentiment_coherence(review_text, rating) * 0.20 +
        75 * 0.15 +  # Timing: baseline (no timestamp data)
        _score_incentive_language(review_text) * 0.10
    )

    return min(100, max(0, int(weighted)))


async def score_authenticity_batch(reviews: list[dict]) -> list[dict]:
    """
    Score authenticity for batch of reviews (heuristic-based, fast, free).

    Returns reviews with auth_score (0-100) added.
    """
    if not reviews:
        return []

    for review in reviews:
        review['auth_score'] = score_review(
            review_text=review.get('text', ''),
            rating=review.get('rating', 3),
            account_age_days=review.get('account_age_days'),
            review_count=review.get('review_count'),
            category_diversity=review.get('category_diversity'),
        )

    logger.info(f"Scored {len(reviews)} reviews for authenticity (heuristic-based)")
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
