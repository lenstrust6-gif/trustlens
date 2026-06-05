"""Database optimization - indexes and query tuning."""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)


async def create_indexes(session: AsyncSession) -> None:
    """Create database indexes for performance."""
    indexes = [
        # Products
        "CREATE INDEX IF NOT EXISTS idx_products_locale ON products(locale)",
        "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
        "CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)",
        "CREATE INDEX IF NOT EXISTS idx_products_locale_category ON products(locale, category)",

        # Verdicts
        "CREATE INDEX IF NOT EXISTS idx_verdicts_product_id ON verdicts(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_verdicts_trust_score ON verdicts(trust_score DESC)",
        "CREATE INDEX IF NOT EXISTS idx_verdicts_created_at ON verdicts(created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_verdicts_expires_at ON verdicts(expires_at)",

        # Ratings
        "CREATE INDEX IF NOT EXISTS idx_verdict_ratings_verdict_id ON verdict_ratings(verdict_id)",
        "CREATE INDEX IF NOT EXISTS idx_verdict_ratings_user_id ON verdict_ratings(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_verdict_ratings_helpful ON verdict_ratings(helpful)",

        # Emails
        "CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status)",
        "CREATE INDEX IF NOT EXISTS idx_emails_verdict_id ON emails(verdict_id)",
        "CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient)",

        # Users
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
        "CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)",

        # Preferences
        "CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id)",

        # Saved Searches
        "CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_saved_searches_last_searched ON saved_searches(last_searched DESC)",

        # Affiliate Links
        "CREATE INDEX IF NOT EXISTS idx_affiliate_links_product_id ON affiliate_links(product_id)",

        # Search Misses
        "CREATE INDEX IF NOT EXISTS idx_search_misses_count ON search_misses(count DESC)",
        "CREATE INDEX IF NOT EXISTS idx_search_misses_locale ON search_misses(locale)",
    ]

    for index_sql in indexes:
        try:
            await session.execute(text(index_sql))
            logger.info(f"Created index: {index_sql.split('ON')[1].strip()}")
        except Exception as e:
            logger.warning(f"Index already exists or error: {str(e)}")

    await session.commit()


async def analyze_query_performance(session: AsyncSession) -> None:
    """Run ANALYZE to update query planner statistics."""
    tables = [
        "products",
        "verdicts",
        "verdict_ratings",
        "emails",
        "users",
        "user_preferences",
        "saved_searches",
        "affiliate_links",
        "search_misses",
    ]

    for table in tables:
        try:
            await session.execute(text(f"ANALYZE {table}"))
            logger.info(f"Analyzed table: {table}")
        except Exception as e:
            logger.warning(f"Error analyzing {table}: {str(e)}")

    await session.commit()


async def optimize_database(session: AsyncSession) -> None:
    """Run all database optimizations."""
    logger.info("Starting database optimizations...")

    await create_indexes(session)
    await analyze_query_performance(session)

    logger.info("Database optimization complete!")
