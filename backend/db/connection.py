from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from backend.config import settings
import logging

logger = logging.getLogger(__name__)

# Don't create engine at module load time - create it lazily
_engine = None
_AsyncSessionLocal = None


def _get_engine():
    """Lazy-load database engine."""
    global _engine
    if _engine is None:
        try:
            _engine = create_async_engine(
                settings.database_url,
                echo=settings.is_dev,
                future=True,
                pool_pre_ping=False,  # Disable ping to avoid connection attempts
                pool_recycle=3600,
                pool_size=5,
                max_overflow=10,
                connect_args={
                    "statement_cache_size": 0,
                    "timeout": 5,
                },
            )
        except Exception as e:
            logger.warning(f"Failed to create database engine: {e}")
            return None
    return _engine


def _get_session_factory():
    """Lazy-load session factory."""
    global _AsyncSessionLocal
    if _AsyncSessionLocal is None:
        engine = _get_engine()
        if engine:
            _AsyncSessionLocal = sessionmaker(
                engine,
                class_=AsyncSession,
                expire_on_commit=False,
            )
    return _AsyncSessionLocal


async def get_db_session():
    """Get a database session."""
    factory = _get_session_factory()
    if factory is None:
        raise RuntimeError("Database not available")
    async with factory() as session:
        yield session
