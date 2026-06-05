import pytest
from backend.main import app


def test_app_exists():
    """Test that FastAPI app is created."""
    assert app is not None
    assert app.title == "TrustLens API"


def test_routes_registered():
    """Test that all routes are registered."""
    routes = [route.path for route in app.routes]

    # Health endpoint
    assert "/api/v1/health" in routes

    # Search endpoint
    assert "/api/v1/search" in routes

    # Product endpoint
    assert "/api/v1/verdict/{locale}/{slug}" in routes

    # Submit endpoint
    assert "/api/v1/submit" in routes

    # Categories endpoint
    assert "/api/v1/categories/{locale}" in routes

    # Admin endpoints
    admin_routes = [r for r in routes if r.startswith("/admin")]
    assert len(admin_routes) > 0


def test_cors_middleware_added():
    """Test that CORS middleware is configured."""
    middleware = [m for m in app.user_middleware if "CORSMiddleware" in str(m)]
    assert len(middleware) > 0


def test_root_endpoint_exists():
    """Test root endpoint is registered."""
    routes = [route.path for route in app.routes]
    assert "/" in routes
