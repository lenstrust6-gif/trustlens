"""
Seed script: Insert 50 Indian tech products with sample verdicts.
Run: python -m backend.scripts.seed_products
"""
import asyncio
import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.config import settings
from backend.db import models
from backend.db import repositories as repos

SEED_PRODUCTS = [
    # TWS Earbuds (10)
    ("boAt Airdopes 141", "boat-airdopes-141", "tws-earbuds", "boAt", "in"),
    ("Noise Buds Pro", "noise-buds-pro", "tws-earbuds", "Noise", "in"),
    ("Realme Buds Air 3S", "realme-buds-air-3s", "tws-earbuds", "Realme", "in"),
    ("OnePlus Buds Z2", "oneplus-buds-z2", "tws-earbuds", "OnePlus", "in"),
    ("Mivi DuoPods M70", "mivi-duopods-m70", "tws-earbuds", "Mivi", "in"),
    ("Fire-Boltt Beast", "fire-boltt-beast", "tws-earbuds", "Fire-Boltt", "in"),
    ("Ambrane Dot", "ambrane-dot", "tws-earbuds", "Ambrane", "in"),
    ("Sony WF-C700N", "sony-wf-c700n", "tws-earbuds", "Sony", "in"),
    ("Samsung Galaxy Buds2 Pro", "samsung-galaxy-buds2-pro", "tws-earbuds", "Samsung", "in"),
    ("Apple AirPods Pro", "apple-airpods-pro", "tws-earbuds", "Apple", "in"),

    # Smartwatches (10)
    ("Noise ColorFit Pro 4", "noise-colorfitpro4", "smartwatches", "Noise", "in"),
    ("boAt Storm", "boat-storm", "smartwatches", "boAt", "in"),
    ("Fire-Boltt Venus", "fire-boltt-venus", "smartwatches", "Fire-Boltt", "in"),
    ("Realme Watch 4", "realme-watch-4", "smartwatches", "Realme", "in"),
    ("Amazfit GTS 4", "amazfit-gts-4", "smartwatches", "Amazfit", "in"),
    ("Mi Watch Revolve", "mi-watch-revolve", "smartwatches", "Xiaomi", "in"),
    ("HONOR Band 7", "honor-band-7", "smartwatches", "HONOR", "in"),
    ("Samsung Galaxy Watch5", "samsung-galaxy-watch5", "smartwatches", "Samsung", "in"),
    ("Apple Watch Series 8", "apple-watch-series-8", "smartwatches", "Apple", "in"),
    ("Garmin Venu 2", "garmin-venu-2", "smartwatches", "Garmin", "in"),

    # Wireless Headphones (10)
    ("boAt Rockerz 400", "boat-rockerz-400", "wireless-headphones", "boAt", "in"),
    ("JBL Tune 710BT", "jbl-tune-710bt", "wireless-headphones", "JBL", "in"),
    ("Sennheiser HD 450SE", "sennheiser-hd-450se", "wireless-headphones", "Sennheiser", "in"),
    ("Sony WH-CH520", "sony-wh-ch520", "wireless-headphones", "Sony", "in"),
    ("Noise Evolve 2", "noise-evolve-2", "wireless-headphones", "Noise", "in"),
    ("Mivi Super Bass", "mivi-super-bass", "wireless-headphones", "Mivi", "in"),
    ("Realme DIZO GH101", "realme-dizo-gh101", "wireless-headphones", "Realme", "in"),
    ("OneOdio A30", "oneodio-a30", "wireless-headphones", "OneOdio", "in"),
    ("Skullcandy Crusher Evo", "skullcandy-crusher-evo", "wireless-headphones", "Skullcandy", "in"),
    ("Bose QuietComfort 45", "bose-quietcomfort-45", "wireless-headphones", "Bose", "in"),

    # Bluetooth Speakers (10)
    ("JBL Go 3", "jbl-go-3", "bluetooth-speakers", "JBL", "in"),
    ("boAt Stone 800", "boat-stone-800", "bluetooth-speakers", "boAt", "in"),
    ("UE Boom 3", "ue-boom-3", "bluetooth-speakers", "UE", "in"),
    ("Sony SRS-XB23", "sony-srs-xb23", "bluetooth-speakers", "Sony", "in"),
    ("Noise Buzz Buds", "noise-buzz-buds", "bluetooth-speakers", "Noise", "in"),
    ("Mi Portable Bluetooth Speaker", "mi-portable-bluetooth-speaker", "bluetooth-speakers", "Xiaomi", "in"),
    ("Marshall Kilburn II", "marshall-kilburn-ii", "bluetooth-speakers", "Marshall", "in"),
    ("Ultimate Ears MegaBoom 3", "ue-megaboom-3", "bluetooth-speakers", "UE", "in"),
    ("Anker Soundcore 2", "anker-soundcore-2", "bluetooth-speakers", "Anker", "in"),
    ("Bose SoundLink Mini II", "bose-soundlink-mini-ii", "bluetooth-speakers", "Bose", "in"),

    # Power Banks (10)
    ("Mi Power Bank 3i", "mi-power-bank-3i", "power-banks", "Xiaomi", "in"),
    ("boAt Energyshroom PB500", "boat-energyshroom-pb500", "power-banks", "boAt", "in"),
    ("Realme 30000mAh", "realme-30000mah", "power-banks", "Realme", "in"),
    ("Anker PowerCore Essential 20000", "anker-powercore-essential-20000", "power-banks", "Anker", "in"),
    ("Ambrane PowerBank 10000", "ambrane-powerbank-10000", "power-banks", "Ambrane", "in"),
    ("Noise PowerBank 10000", "noise-powerbank-10000", "power-banks", "Noise", "in"),
    ("Mivi Power Bank 5000", "mivi-power-bank-5000", "power-banks", "Mivi", "in"),
    ("OnePlus Power Bank 10000", "oneplus-power-bank-10000", "power-banks", "OnePlus", "in"),
    ("Samsung Portable SSD T5", "samsung-portable-ssd-t5", "power-banks", "Samsung", "in"),
    ("Romoss Sense 6", "romoss-sense-6", "power-banks", "Romoss", "in"),
]


async def seed_database():
    """Insert 50 seed products with sample verdicts."""
    engine = create_async_engine(settings.database_url, echo=False)

    # Create tables first
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        created = 0
        for product_name, slug, category, brand, locale in SEED_PRODUCTS:
            try:
                # Create product
                product = await repos.products.create(
                    session,
                    name=product_name,
                    slug=slug,
                    locale=locale,
                    category=category,
                    brand=brand,
                )

                # Create sample verdict (realistic values)
                score = 7.5 + (hash(slug) % 25) / 10  # 7.5–9.9 range
                await repos.verdicts.create(
                    session,
                    product_id=product.id,
                    trust_score=Decimal(str(round(score, 1))),
                    summary=f"A solid {category.replace('-', ' ')} from {brand}. Good value for money with reliable build quality. Suitable for daily use.",
                    pros=[
                        {"text": "Good audio quality", "mentions": 45},
                        {"text": "Affordable price", "mentions": 38},
                        {"text": "Decent battery life", "mentions": 32},
                    ],
                    cons=[
                        {"text": "Build feels plastic", "mentions": 15},
                        {"text": "Customer support slow", "mentions": 12},
                    ],
                    best_for=["Budget-conscious buyers", "Daily commuters"],
                    avoid_if=["Premium sound seekers", "Outdoor enthusiasts"],
                    feature_scores={
                        "sound_quality": 7.2,
                        "battery_life": 7.8,
                        "build_quality": 6.9,
                        "comfort": 7.5,
                    },
                    spec_tags={"sound": "confirms", "battery": "confirms", "design": "mixed"},
                    confidence_tier="established",
                    source_count_yt=42,
                    source_count_amz=38,
                    auth_score_avg=Decimal("74.5"),
                    reviews_excluded=8,
                )

                await session.commit()
                created += 1
                print(f"✓ {product_name} ({category})")

            except Exception as e:
                await session.rollback()
                print(f"✗ {product_name}: {e}")

        print(f"\n✅ Seeded {created}/{len(SEED_PRODUCTS)} products")


if __name__ == "__main__":
    asyncio.run(seed_database())
