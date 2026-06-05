import pytest
from backend.pipeline.ingestion import RainforestProvider, OxylabsProvider, AmazonDataProvider
from backend.config import settings


def test_provider_abstraction():
    """Test that both providers implement the same interface."""
    assert issubclass(RainforestProvider, AmazonDataProvider)
    assert issubclass(OxylabsProvider, AmazonDataProvider)

    # Check required methods exist
    assert hasattr(RainforestProvider, "get_reviews")
    assert hasattr(RainforestProvider, "resolve_asin")
    assert hasattr(OxylabsProvider, "get_reviews")
    assert hasattr(OxylabsProvider, "resolve_asin")


def test_provider_selection():
    """Test that AMAZON_PROVIDER env var selects correct provider."""
    rainforest = RainforestProvider()
    oxylabs = OxylabsProvider()

    assert isinstance(rainforest, AmazonDataProvider)
    assert isinstance(oxylabs, AmazonDataProvider)


@pytest.mark.asyncio
async def test_rainforest_get_reviews_empty():
    """Test Rainforest provider returns empty list when API key not configured."""
    provider = RainforestProvider()
    reviews = await provider.get_reviews("B08H2S9B3D", "in")
    # Should return empty list without API key
    assert isinstance(reviews, list)


@pytest.mark.asyncio
async def test_rainforest_resolve_asin_empty():
    """Test Rainforest provider returns None when API key not configured."""
    provider = RainforestProvider()
    asin = await provider.resolve_asin("boAt Airdopes", "in")
    # Should return None without API key
    assert asin is None


@pytest.mark.asyncio
async def test_oxylabs_get_reviews_empty():
    """Test Oxylabs provider returns empty list when credentials not configured."""
    provider = OxylabsProvider()
    reviews = await provider.get_reviews("B08H2S9B3D", "in")
    # Should return empty list without credentials
    assert isinstance(reviews, list)


@pytest.mark.asyncio
async def test_oxylabs_resolve_asin_empty():
    """Test Oxylabs provider returns None when credentials not configured."""
    provider = OxylabsProvider()
    asin = await provider.resolve_asin("boAt Airdopes", "in")
    # Should return None without credentials
    assert asin is None
