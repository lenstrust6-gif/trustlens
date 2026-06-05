import pytest
from unittest.mock import AsyncMock, patch
from backend.pipeline.orchestrator import fetch_raw_data, fetch_with_fallback


@pytest.mark.asyncio
async def test_fetch_raw_data_returns_dict():
    """Test fetch_raw_data returns expected dict structure."""
    with patch("backend.pipeline.orchestrator.youtube_fetcher") as mock_yt:
        with patch("backend.pipeline.orchestrator.amazon_provider") as mock_amz:
            mock_yt.fetch_comments = AsyncMock(return_value=[{"text": "great"}])
            mock_amz.get_reviews_by_name = AsyncMock(
                return_value=[{"text": "good", "rating": 5}]
            )

            result = await fetch_raw_data("test product", "in")

            assert isinstance(result, dict)
            assert "youtube_comments" in result
            assert "amazon_reviews" in result
            assert "product_name" in result
            assert "locale" in result
            assert "fetch_ok" in result
            assert result["product_name"] == "test product"
            assert result["locale"] == "in"
            assert result["fetch_ok"] is True
            assert len(result["youtube_comments"]) == 1
            assert len(result["amazon_reviews"]) == 1


@pytest.mark.asyncio
async def test_fetch_raw_data_youtube_fails():
    """Test that fetch_raw_data handles YouTube failure gracefully."""
    with patch("backend.pipeline.orchestrator.youtube_fetcher") as mock_yt:
        with patch("backend.pipeline.orchestrator.amazon_provider") as mock_amz:
            mock_yt.fetch_comments = AsyncMock(side_effect=Exception("timeout"))
            mock_amz.get_reviews_by_name = AsyncMock(
                return_value=[{"text": "good", "rating": 5}]
            )

            result = await fetch_raw_data("test product", "in")

            assert result["fetch_ok"] is True
            assert len(result["youtube_comments"]) == 0
            assert len(result["amazon_reviews"]) == 1


@pytest.mark.asyncio
async def test_fetch_raw_data_both_fail():
    """Test that fetch_ok=False when both sources fail."""
    with patch("backend.pipeline.orchestrator.youtube_fetcher") as mock_yt:
        with patch("backend.pipeline.orchestrator.amazon_provider") as mock_amz:
            mock_yt.fetch_comments = AsyncMock(side_effect=Exception("timeout"))
            mock_amz.get_reviews_by_name = AsyncMock(side_effect=Exception("error"))

            result = await fetch_raw_data("test product", "in")

            assert result["fetch_ok"] is False
            assert len(result["youtube_comments"]) == 0
            assert len(result["amazon_reviews"]) == 0


@pytest.mark.asyncio
async def test_fetch_with_fallback_timeout():
    """Test fetch_with_fallback returns fallback on timeout."""
    async def slow_fn():
        await asyncio.sleep(15)
        return [{"data": "test"}]

    import asyncio

    result = await fetch_with_fallback(slow_fn, fallback=[], label="test")
    assert result == []


@pytest.mark.asyncio
async def test_fetch_with_fallback_exception():
    """Test fetch_with_fallback returns fallback on exception."""
    async def error_fn():
        raise ValueError("test error")

    result = await fetch_with_fallback(error_fn, fallback=[], label="test")
    assert result == []


@pytest.mark.asyncio
async def test_fetch_with_fallback_success():
    """Test fetch_with_fallback returns result on success."""
    async def success_fn():
        return [{"text": "comment"}]

    result = await fetch_with_fallback(success_fn, fallback=[], label="test")
    assert result == [{"text": "comment"}]


def test_youtube_fetcher_exists():
    """Test YouTubeFetcher is importable."""
    from backend.pipeline.ingestion.youtube import YouTubeFetcher

    fetcher = YouTubeFetcher()
    assert fetcher.SEARCH_URL == "https://www.googleapis.com/youtube/v3/search"
    assert fetcher.COMMENTS_URL == "https://www.googleapis.com/youtube/v3/commentThreads"


@pytest.mark.asyncio
async def test_youtube_empty_without_key():
    """Test YouTube returns empty list without API key."""
    from backend.pipeline.ingestion.youtube import YouTubeFetcher

    with patch("backend.pipeline.ingestion.youtube.settings") as mock_settings:
        mock_settings.youtube_api_key = ""

        fetcher = YouTubeFetcher()
        result = await fetcher.fetch_comments("test", "in")

        assert result == []


def test_amazon_provider_selection():
    """Test AMAZON_PROVIDER env var selects correct provider."""
    from backend.pipeline.orchestrator import amazon_provider
    from backend.pipeline.ingestion.rainforest import RainforestProvider
    from backend.pipeline.ingestion.oxylabs import OxylabsProvider

    # Should be one or the other
    assert isinstance(amazon_provider, (RainforestProvider, OxylabsProvider))
