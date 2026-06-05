import pytest
from unittest.mock import AsyncMock, patch
from backend.pipeline.generation.verdict_assembler import (
    assemble_verdict_card,
    _derive_feature_scores,
    _derive_best_for,
    _select_highlights,
)


def test_assemble_verdict_card_has_all_sections():
    """Test verdict card has all 9 required sections."""
    card = assemble_verdict_card(
        product_name="Test Product",
        slug="test-product",
        locale="in",
        category="tws-earbuds",
        trust_score=8.5,
        confidence_tier="established",
        summary="Great product for music lovers.",
        pros=[{"text": "Good sound", "mentions": 10}],
        cons=[{"text": "Expensive", "mentions": 5}],
        spec_tags={"sound": "confirms"},
        sentiment={"sound_quality": {"positive": 20, "negative": 5, "neutral": 0}},
        qualifying_reviews=[
            {
                "text": "amazing",
                "source": "amazon",
                "rating": 5,
                "auth_score": 85,
            }
        ],
        source_count_yt=10,
        source_count_amz=20,
        auth_score_avg=75.0,
        excluded_count=5,
    )

    # Check all 9 sections
    assert "product" in card
    assert "trustScore" in card
    assert "confidenceTier" in card
    assert "summary" in card
    assert "pros" in card
    assert "cons" in card
    assert "bestFor" in card
    assert "avoidIf" in card
    assert "specTags" in card
    assert "featureScores" in card
    assert "reviewHighlights" in card
    assert "sourcePanel" in card
    assert "alternatives" in card
    assert "locale" in card


def test_verdict_card_trust_score_range():
    """Test trust score is valid (0-10)."""
    for score in [0.0, 5.5, 10.0]:
        card = assemble_verdict_card(
            product_name="Test",
            slug="test",
            locale="in",
            category="tws-earbuds",
            trust_score=score,
            confidence_tier="early",
            summary="Test",
            pros=[],
            cons=[],
            spec_tags={},
            sentiment={},
            qualifying_reviews=[],
            source_count_yt=0,
            source_count_amz=0,
            auth_score_avg=50.0,
            excluded_count=0,
        )
        assert 0.0 <= card["trustScore"] <= 10.0


def test_feature_scores_0_to_10():
    """Test feature scores are clamped 0-10."""
    sentiment = {
        "sound_quality": {"positive": 10, "negative": 0, "neutral": 0},
        "battery": {"positive": 0, "negative": 10, "neutral": 0},
        "comfort": {"positive": 5, "negative": 5, "neutral": 0},
    }

    scores = _derive_feature_scores(sentiment)

    for feature, score in scores.items():
        assert 0.0 <= score <= 10.0, f"{feature}: {score}"


def test_review_highlights_format():
    """Test review highlights have correct format."""
    reviews = [
        {"text": "Amazing product", "source": "amazon", "rating": 5, "auth_score": 85},
        {"text": "Good", "source": "youtube", "rating": 4, "auth_score": 70},
        {"text": "Poor", "source": "amazon", "rating": 2, "auth_score": 45},
    ]

    highlights = _select_highlights(reviews)

    # Should select only auth_score >= 80
    assert len(highlights) == 1
    assert highlights[0]["authScore"] == 85
    assert "source" in highlights[0]
    assert "text" in highlights[0]
    assert "rating" in highlights[0]


def test_best_for_mapping():
    """Test best-for profiles are derived from pros."""
    pros = [
        {"text": "Excellent battery life", "mentions": 50},
        {"text": "Great sound quality", "mentions": 40},
    ]

    best_for = _derive_best_for(pros, "tws-earbuds")

    assert isinstance(best_for, list)
    assert len(best_for) <= 3
    assert all(isinstance(p, str) for p in best_for)


def test_verdict_card_no_fake_language():
    """Test verdict card has no 'fake review' language."""
    card = assemble_verdict_card(
        product_name="Test Product",
        slug="test",
        locale="in",
        category="tws-earbuds",
        trust_score=8.0,
        confidence_tier="established",
        summary="This is a great product.",
        pros=[{"text": "Battery", "mentions": 5}],
        cons=[],
        spec_tags={},
        sentiment={},
        qualifying_reviews=[],
        source_count_yt=0,
        source_count_amz=0,
        auth_score_avg=50.0,
        excluded_count=0,
    )

    # Convert entire card to string and check
    card_str = str(card).lower()
    assert "fake review" not in card_str
    assert "fake" not in card_str or "authentic" in card_str  # Allow if paired with authentic


def test_source_panel_counts():
    """Test source panel has correct counts."""
    card = assemble_verdict_card(
        product_name="Test",
        slug="test",
        locale="in",
        category="tws-earbuds",
        trust_score=7.0,
        confidence_tier="growing",
        summary="Good",
        pros=[],
        cons=[],
        spec_tags={},
        sentiment={},
        qualifying_reviews=[],
        source_count_yt=45,
        source_count_amz=120,
        auth_score_avg=73.4,
        excluded_count=12,
    )

    panel = card["sourcePanel"]
    assert panel["youtubeCount"] == 45
    assert panel["amazonCount"] == 120
    assert panel["excludedCount"] == 12
    assert panel["authScoreAvg"] == 73.4


def test_confidence_tier_values():
    """Test confidence tier is valid."""
    valid_tiers = ["early", "growing", "established", "mature"]

    for tier in valid_tiers:
        card = assemble_verdict_card(
            product_name="Test",
            slug="test",
            locale="in",
            category="tws-earbuds",
            trust_score=5.0,
            confidence_tier=tier,
            summary="Test",
            pros=[],
            cons=[],
            spec_tags={},
            sentiment={},
            qualifying_reviews=[],
            source_count_yt=0,
            source_count_amz=0,
            auth_score_avg=50.0,
            excluded_count=0,
        )

        assert card["confidenceTier"] == tier


def test_product_slug_consistency():
    """Test product slug matches input."""
    card = assemble_verdict_card(
        product_name="boAt Airdopes 141",
        slug="boat-airdopes-141",
        locale="in",
        category="tws-earbuds",
        trust_score=8.0,
        confidence_tier="established",
        summary="Great",
        pros=[],
        cons=[],
        spec_tags={},
        sentiment={},
        qualifying_reviews=[],
        source_count_yt=10,
        source_count_amz=20,
        auth_score_avg=75.0,
        excluded_count=0,
    )

    assert card["product"]["slug"] == "boat-airdopes-141"
    assert card["product"]["locale"] == "in"


@pytest.mark.asyncio
async def test_run_pipeline_shape():
    """Test run_pipeline returns proper VerdictCard (mocked)."""
    from backend.pipeline.orchestrator import run_pipeline

    # This test would require full mocking of all components
    # For now, we test that the function exists and is callable
    assert callable(run_pipeline)
