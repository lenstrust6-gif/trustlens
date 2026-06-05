import pytest
from datetime import datetime, timedelta
from backend.workers.refresh_scheduler import get_refresh_interval_hours


def test_refresh_interval_new_product():
    """Products < 30 days old: refresh every 2 days (48 hours)."""
    assert get_refresh_interval_hours(0) == 48
    assert get_refresh_interval_hours(14) == 48
    assert get_refresh_interval_hours(29) == 48


def test_refresh_interval_growing_product():
    """Products 30–180 days old: refresh weekly (168 hours)."""
    assert get_refresh_interval_hours(30) == 168
    assert get_refresh_interval_hours(90) == 168
    assert get_refresh_interval_hours(179) == 168


def test_refresh_interval_mature_product():
    """Products > 180 days old: refresh monthly (720 hours)."""
    assert get_refresh_interval_hours(180) == 720
    assert get_refresh_interval_hours(365) == 720
    assert get_refresh_interval_hours(730) == 720


def test_refresh_interval_boundaries():
    """Test exact boundary conditions."""
    # Day 30 should still be in the "growing" tier
    assert get_refresh_interval_hours(30) == 168

    # Day 180 should move to "mature" tier
    assert get_refresh_interval_hours(180) == 720
