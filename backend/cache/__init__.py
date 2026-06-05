from .redis_client import (
    init_redis,
    close_redis,
    get_verdict,
    set_verdict,
    get_category,
    set_category,
    get_hit_rate,
)

__all__ = [
    "init_redis",
    "close_redis",
    "get_verdict",
    "set_verdict",
    "get_category",
    "set_category",
    "get_hit_rate",
]
