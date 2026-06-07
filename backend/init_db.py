"""Initialize database schema by creating all tables."""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from backend.db.models import Base

# Load .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

async def init_db():
    """Create all tables in the database."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not set in .env")

    print(f"Connecting to database: {database_url[:80]}...")

    engine = create_async_engine(database_url, echo=True)

    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ All tables created successfully!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
