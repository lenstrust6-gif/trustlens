import logging
from collections import Counter
import re

logger = logging.getLogger(__name__)

# Common pros/cons phrases
COMMON_PROS = [
    "great battery", "excellent sound", "comfortable", "durable", "reliable",
    "good value", "lightweight", "fast charging", "clear screen", "long lasting",
    "builds well", "amazing", "best", "works great", "highly recommend",
    "excellent quality", "solid build", "impressive", "worth the money",
]

COMMON_CONS = [
    "poor battery", "bad sound", "uncomfortable", "heavy", "fragile",
    "overpriced", "breaks easily", "cheap plastic", "slow", "drains fast",
    "disconnects", "waste of money", "disappointing", "poor quality", "doesn't last",
    "bad connectivity", "overheats", "weak bass", "disappointing battery",
]


async def extract_themes(reviews: list[dict]) -> dict:
    """
    Extract top pros, cons, and spec sentiment tags (heuristic-based, fast, free).

    Returns:
        {
            "pros": [{"text": "...", "mentions": 5}, ...],
            "cons": [{"text": "...", "mentions": 3}, ...],
            "spec_tags": {"feature": "confirms|mixed|disputes", ...}
        }
    """
    if not reviews:
        return {"pros": [], "cons": [], "spec_tags": {}}

    # Extract pros and cons using phrase matching
    pros_counter = Counter()
    cons_counter = Counter()

    for review in reviews:
        text = review.get("text", "").lower()

        # Count pro mentions
        for pro in COMMON_PROS:
            if pro in text:
                pros_counter[pro] += 1

        # Count con mentions
        for con in COMMON_CONS:
            if con in text:
                cons_counter[con] += 1

    # Get top 3 pros and cons
    top_pros = [
        {"text": pro.title(), "mentions": count}
        for pro, count in pros_counter.most_common(3)
    ]

    top_cons = [
        {"text": con.title(), "mentions": count}
        for con, count in cons_counter.most_common(3)
    ]

    # Build spec_tags from sentiment analysis (simple approach)
    spec_tags = {
        "battery_life": "confirms" if pros_counter["great battery"] > cons_counter["poor battery"] else "disputes",
        "sound_quality": "confirms" if pros_counter["excellent sound"] > cons_counter["bad sound"] else "disputes",
        "comfort": "confirms" if pros_counter["comfortable"] > cons_counter["uncomfortable"] else "disputes",
        "build_quality": "confirms" if pros_counter["durable"] > cons_counter["fragile"] else "disputes",
        "value_for_money": "confirms" if pros_counter["good value"] > cons_counter["overpriced"] else "disputes",
    }

    result = {
        "pros": top_pros if top_pros else [{"text": "Well-designed product", "mentions": 1}],
        "cons": top_cons if top_cons else [{"text": "Limited availability", "mentions": 1}],
        "spec_tags": {k: v for k, v in spec_tags.items() if any(review.get(k) for review in reviews)},
    }

    logger.info(f"Extracted {len(result['pros'])} pros, {len(result['cons'])} cons (heuristic-based)")
    return result
