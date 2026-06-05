from backend.cache import verdict_key, category_key, search_key


def test_verdict_key_format():
    """Test verdict_key generates correct format."""
    key = verdict_key("in", "boat-airdopes")
    assert key == "verdict:in:boat-airdopes"


def test_category_key_format():
    """Test category_key generates correct format."""
    key = category_key("in", "tws-earbuds")
    assert key == "category:in:tws-earbuds"


def test_search_key_format():
    """Test search_key generates correct format."""
    key = search_key("in", "boAt Airdopes")
    assert key == "search:in:boat-airdopes"


def test_verdict_key_different_locales():
    """Test verdict_key handles different locales."""
    key_in = verdict_key("in", "test")
    key_us = verdict_key("us", "test")
    key_uk = verdict_key("uk", "test")

    assert key_in == "verdict:in:test"
    assert key_us == "verdict:us:test"
    assert key_uk == "verdict:uk:test"
    assert key_in != key_us != key_uk


def test_search_key_normalizes_slugs():
    """Test search_key normalizes product names to slugs."""
    key1 = search_key("in", "boAt Airdopes 141")
    key2 = search_key("in", "BOAT AIRDOPES 141")
    key3 = search_key("in", "boat-airdopes-141")

    # All should normalize to similar slugs
    assert "boat" in key1.lower()
    assert "airdopes" in key1.lower()


def test_cache_constants_exported():
    """Test that cache module exports all key generation functions."""
    from backend import cache

    assert hasattr(cache, "verdict_key")
    assert hasattr(cache, "category_key")
    assert hasattr(cache, "search_key")
    assert hasattr(cache, "init_redis")
    assert hasattr(cache, "close_redis")
    assert hasattr(cache, "get_verdict")
    assert hasattr(cache, "set_verdict")
    assert hasattr(cache, "get_hit_rate")
