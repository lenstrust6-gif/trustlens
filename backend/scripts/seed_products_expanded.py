"""Seed 210 products with better category distribution for TrustLens."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.config import settings
from backend.db import repositories as repos
from backend.db.models import Base

SEED_PRODUCTS = [
    # TWS Earbuds (30 products)
    ("boAt Airdopes 141", "boat-airdopes-141", "tws-earbuds", "boAt"),
    ("Noise Buds Pro", "noise-buds-pro", "tws-earbuds", "Noise"),
    ("Realme Buds Air 3S", "realme-buds-air-3s", "tws-earbuds", "Realme"),
    ("OnePlus Buds Z2", "oneplus-buds-z2", "tws-earbuds", "OnePlus"),
    ("Mivi DuoPods M70", "mivi-duopods-m70", "tws-earbuds", "Mivi"),
    ("Fire-Boltt Beast", "fire-boltt-beast", "tws-earbuds", "Fire-Boltt"),
    ("Ambrane Dot", "ambrane-dot", "tws-earbuds", "Ambrane"),
    ("Sony WF-C700N", "sony-wf-c700n", "tws-earbuds", "Sony"),
    ("Samsung Galaxy Buds2 Pro", "samsung-galaxy-buds2-pro", "tws-earbuds", "Samsung"),
    ("Apple AirPods Pro", "apple-airpods-pro", "tws-earbuds", "Apple"),
    ("JBL Live Flex", "jbl-live-flex", "tws-earbuds", "JBL"),
    ("Soundcore Space A40", "soundcore-space-a40", "tws-earbuds", "Soundcore"),
    ("Anker Soundcore Liberty 4", "anker-soundcore-liberty-4", "tws-earbuds", "Anker"),
    ("Sennheiser Momentum True Wireless 4", "sennheiser-mtw4", "tws-earbuds", "Sennheiser"),
    ("Nothing Ear 2", "nothing-ear-2", "tws-earbuds", "Nothing"),
    ("Boat Airdopes 131", "boat-airdopes-131", "tws-earbuds", "boAt"),
    ("Noise Icon Pro", "noise-icon-pro", "tws-earbuds", "Noise"),
    ("Realme Buds T300", "realme-buds-t300", "tws-earbuds", "Realme"),
    ("Xiaomi Buds 4", "xiaomi-buds-4", "tws-earbuds", "Xiaomi"),
    ("Oppo Enco Air 3", "oppo-enco-air-3", "tws-earbuds", "Oppo"),
    ("Vivo TWS 3", "vivo-tws-3", "tws-earbuds", "Vivo"),
    ("Poco Pods 2", "poco-pods-2", "tws-earbuds", "Poco"),
    ("Motorola Edge Buds", "motorola-edge-buds", "tws-earbuds", "Motorola"),
    ("Nothing Ear 1", "nothing-ear-1", "tws-earbuds", "Nothing"),
    ("Technics EAH-AZ80", "technics-eah-az80", "tws-earbuds", "Technics"),
    ("Philips TAT8606", "philips-tat8606", "tws-earbuds", "Philips"),
    ("Boat Airdopes 190", "boat-airdopes-190", "tws-earbuds", "boAt"),
    ("Noise Buds VS101 Pro", "noise-buds-vs101-pro", "tws-earbuds", "Noise"),
    ("boAt Airdopes 441", "boat-airdopes-441", "tws-earbuds", "boAt"),
    ("Soundcore Space A55", "soundcore-space-a55", "tws-earbuds", "Soundcore"),

    # Smartwatches (30 products)
    ("Noise ColorFit Pro 4", "noise-colorfit-pro-4", "smartwatches", "Noise"),
    ("boAt Storm", "boat-storm", "smartwatches", "boAt"),
    ("Fire-Boltt Venus", "fire-boltt-venus", "smartwatches", "Fire-Boltt"),
    ("Realme Watch 4", "realme-watch-4", "smartwatches", "Realme"),
    ("Amazfit GTS 4", "amazfit-gts-4", "smartwatches", "Amazfit"),
    ("Mi Watch Revolve", "mi-watch-revolve", "smartwatches", "Xiaomi"),
    ("HONOR Band 7", "honor-band-7", "smartwatches", "HONOR"),
    ("Samsung Galaxy Watch5", "samsung-galaxy-watch5", "smartwatches", "Samsung"),
    ("Apple Watch Series 8", "apple-watch-series-8", "smartwatches", "Apple"),
    ("Garmin Venu 2", "garmin-venu-2", "smartwatches", "Garmin"),
    ("Fitbit Sense 2", "fitbit-sense-2", "smartwatches", "Fitbit"),
    ("Huawei Watch GT 3", "huawei-watch-gt-3", "smartwatches", "Huawei"),
    ("Boat Wave Elite", "boat-wave-elite", "smartwatches", "boAt"),
    ("Noise ColorFit Ultra", "noise-colorfit-ultra", "smartwatches", "Noise"),
    ("Fire-Bollt Inferno", "fire-bollt-inferno", "smartwatches", "Fire-Boltt"),
    ("Realme Watch 3 Pro", "realme-watch-3-pro", "smartwatches", "Realme"),
    ("Amazfit Pop Pro", "amazfit-pop-pro", "smartwatches", "Amazfit"),
    ("Mi Band 7 Pro", "mi-band-7-pro", "smartwatches", "Xiaomi"),
    ("HONOR Watch ES 2", "honor-watch-es-2", "smartwatches", "HONOR"),
    ("Samsung Galaxy Watch 4 Classic", "samsung-gw4-classic", "smartwatches", "Samsung"),
    ("Apple Watch SE 2", "apple-watch-se-2", "smartwatches", "Apple"),
    ("Garmin EpidX Gen 2", "garmin-epix-gen2", "smartwatches", "Garmin"),
    ("Fitbit Inspire 3", "fitbit-inspire-3", "smartwatches", "Fitbit"),
    ("Huawei Watch Fit 2", "huawei-watch-fit-2", "smartwatches", "Huawei"),
    ("Oppo Watch 3", "oppo-watch-3", "smartwatches", "Oppo"),
    ("Vivo Watch 2", "vivo-watch-2", "smartwatches", "Vivo"),
    ("OnePlus Watch 2", "oneplus-watch-2", "smartwatches", "OnePlus"),
    ("Boat Xtend", "boat-xtend", "smartwatches", "boAt"),
    ("Noise Icon 2", "noise-icon-2", "smartwatches", "Noise"),
    ("Realme Watch 2 Pro", "realme-watch-2-pro", "smartwatches", "Realme"),

    # Wireless Headphones (30 products)
    ("boAt Rockerz 400", "boat-rockerz-400", "wireless-headphones", "boAt"),
    ("JBL Tune 710BT", "jbl-tune-710bt", "wireless-headphones", "JBL"),
    ("Sennheiser HD 450SE", "sennheiser-hd-450se", "wireless-headphones", "Sennheiser"),
    ("Sony WH-CH520", "sony-wh-ch520", "wireless-headphones", "Sony"),
    ("Noise Evolve 2", "noise-evolve-2", "wireless-headphones", "Noise"),
    ("Mivi Super Bass", "mivi-super-bass", "wireless-headphones", "Mivi"),
    ("Realme DIZO GH101", "realme-dizo-gh101", "wireless-headphones", "Realme"),
    ("OneOdio A30", "oneodio-a30", "wireless-headphones", "OneOdio"),
    ("Skullcandy Crusher Evo", "skullcandy-crusher-evo", "wireless-headphones", "Skullcandy"),
    ("Bose QuietComfort 45", "bose-quietcomfort-45", "wireless-headphones", "Bose"),
    ("boAt Rockerz 450", "boat-rockerz-450", "wireless-headphones", "boAt"),
    ("JBL Tune 760NC", "jbl-tune-760nc", "wireless-headphones", "JBL"),
    ("Sennheiser Momentum 4", "sennheiser-momentum-4", "wireless-headphones", "Sennheiser"),
    ("Sony WH-1000XM5", "sony-wh-1000xm5", "wireless-headphones", "Sony"),
    ("Noise Air Max", "noise-air-max", "wireless-headphones", "Noise"),
    ("Mivi Fort Baas", "mivi-fort-baas", "wireless-headphones", "Mivi"),
    ("Realme Techlife Buds T100", "realme-techlife-buds-t100", "wireless-headphones", "Realme"),
    ("Anker Soundcore Life Q35", "anker-soundcore-life-q35", "wireless-headphones", "Anker"),
    ("Soundcore Space Q45", "soundcore-space-q45", "wireless-headphones", "Soundcore"),
    ("Technics EAH-A800", "technics-eah-a800", "wireless-headphones", "Technics"),
    ("Philips SHL3305", "philips-shl3305", "wireless-headphones", "Philips"),
    ("Edifier W800BT Plus", "edifier-w800bt-plus", "wireless-headphones", "Edifier"),
    ("Soundmagic E11BT", "soundmagic-e11bt", "wireless-headphones", "Soundmagic"),
    ("boAt Rockerz 370", "boat-rockerz-370", "wireless-headphones", "boAt"),
    ("JBL Live 460NC", "jbl-live-460nc", "wireless-headphones", "JBL"),
    ("Audio-Technica ATH-S300BT", "audio-technica-ath-s300bt", "wireless-headphones", "Audio-Technica"),
    ("Corsair HS75 XB", "corsair-hs75-xb", "wireless-headphones", "Corsair"),
    ("HyperX Cloud Stinger 2", "hyperx-cloud-stinger-2", "wireless-headphones", "HyperX"),
    ("SteelSeries Arctis 7", "steelseries-arctis-7", "wireless-headphones", "SteelSeries"),
    ("Razer Blackshark V2", "razer-blackshark-v2", "wireless-headphones", "Razer"),

    # Bluetooth Speakers (30 products)
    ("JBL Go 3", "jbl-go-3", "bluetooth-speakers", "JBL"),
    ("boAt Stone 800", "boat-stone-800", "bluetooth-speakers", "boAt"),
    ("UE Boom 3", "ue-boom-3", "bluetooth-speakers", "UE"),
    ("Sony SRS-XB23", "sony-srs-xb23", "bluetooth-speakers", "Sony"),
    ("Noise Buzz Buds", "noise-buzz-buds", "bluetooth-speakers", "Noise"),
    ("Mi Portable Bluetooth Speaker", "mi-portable-bluetooth-speaker", "bluetooth-speakers", "Xiaomi"),
    ("Marshall Kilburn II", "marshall-kilburn-ii", "bluetooth-speakers", "Marshall"),
    ("Ultimate Ears MegaBoom 3", "ue-megaboom-3", "bluetooth-speakers", "UE"),
    ("Anker Soundcore 2", "anker-soundcore-2", "bluetooth-speakers", "Anker"),
    ("Bose SoundLink Mini II", "bose-soundlink-mini-ii", "bluetooth-speakers", "Bose"),
    ("JBL Flip 6", "jbl-flip-6", "bluetooth-speakers", "JBL"),
    ("boAt Stone 650", "boat-stone-650", "bluetooth-speakers", "boAt"),
    ("UE Wonderboom 3", "ue-wonderboom-3", "bluetooth-speakers", "UE"),
    ("Sony SRS-XB33", "sony-srs-xb33", "bluetooth-speakers", "Sony"),
    ("Noise Icon Boom", "noise-icon-boom", "bluetooth-speakers", "Noise"),
    ("Mi Portable Bluetooth Speaker Pro", "mi-portable-speaker-pro", "bluetooth-speakers", "Xiaomi"),
    ("Marshall Emberton II", "marshall-emberton-ii", "bluetooth-speakers", "Marshall"),
    ("JBL Party Box 110", "jbl-party-box-110", "bluetooth-speakers", "JBL"),
    ("boAt Aavante 1200", "boat-aavante-1200", "bluetooth-speakers", "boAt"),
    ("Beats Pill", "beats-pill", "bluetooth-speakers", "Beats"),
    ("Harman Kardon Esquire 2", "harman-kardon-esquire-2", "bluetooth-speakers", "Harman Kardon"),
    ("Bang & Olufsen Beoplay S3", "bang-olufsen-beoplay-s3", "bluetooth-speakers", "Bang & Olufsen"),
    ("Edifier MR4", "edifier-mr4", "bluetooth-speakers", "Edifier"),
    ("Philips BT6000", "philips-bt6000", "bluetooth-speakers", "Philips"),
    ("Soundcore Motion Boom", "soundcore-motion-boom", "bluetooth-speakers", "Soundcore"),
    ("JBL Authentics 500", "jbl-authentics-500", "bluetooth-speakers", "JBL"),
    ("boAt Roar", "boat-roar", "bluetooth-speakers", "boAt"),
    ("Ultimate Ears Boom 3", "ue-boom-3-alt", "bluetooth-speakers", "UE"),
    ("Sony SRS-XB100", "sony-srs-xb100", "bluetooth-speakers", "Sony"),
    ("Noise Core", "noise-core", "bluetooth-speakers", "Noise"),

    # Power Banks (30 products)
    ("Mi Power Bank 3i", "mi-power-bank-3i", "power-banks", "Xiaomi"),
    ("boAt Energyshroom PB500", "boat-energyshroom-pb500", "power-banks", "boAt"),
    ("Realme 30000mAh", "realme-30000mah", "power-banks", "Realme"),
    ("Anker PowerCore Essential 20000", "anker-powercore-essential-20000", "power-banks", "Anker"),
    ("Ambrane PowerBank 10000", "ambrane-powerbank-10000", "power-banks", "Ambrane"),
    ("Noise PowerBank 10000", "noise-powerbank-10000", "power-banks", "Noise"),
    ("Mivi Power Bank 5000", "mivi-power-bank-5000", "power-banks", "Mivi"),
    ("OnePlus Power Bank 10000", "oneplus-power-bank-10000", "power-banks", "OnePlus"),
    ("Samsung Portable SSD T5", "samsung-portable-ssd-t5", "power-banks", "Samsung"),
    ("Romoss Sense 6", "romoss-sense-6", "power-banks", "Romoss"),
    ("Mi Power Bank 10000", "mi-power-bank-10000", "power-banks", "Xiaomi"),
    ("boAt Powerbank 20000", "boat-powerbank-20000", "power-banks", "boAt"),
    ("Realme 20000mAh", "realme-20000mah", "power-banks", "Realme"),
    ("Anker PowerCore 26800", "anker-powercore-26800", "power-banks", "Anker"),
    ("Ambrane 20000mAh", "ambrane-20000mah", "power-banks", "Ambrane"),
    ("Noise 10000mAh", "noise-10000mah", "power-banks", "Noise"),
    ("Mivi 20000mAh", "mivi-20000mah", "power-banks", "Mivi"),
    ("OnePlus 100W", "oneplus-100w", "power-banks", "OnePlus"),
    ("Samsung 25000mAh", "samsung-25000mah", "power-banks", "Samsung"),
    ("Romoss 65W", "romoss-65w", "power-banks", "Romoss"),
    ("Sandisk iXpand Portable", "sandisk-ixpand-portable", "power-banks", "SanDisk"),
    ("Kingston Data Traveler", "kingston-data-traveler", "power-banks", "Kingston"),
    ("Crucial X9", "crucial-x9", "power-banks", "Crucial"),
    ("Western Digital SSD", "western-digital-ssd", "power-banks", "Western Digital"),
    ("Seagate Fast SSD", "seagate-fast-ssd", "power-banks", "Seagate"),
    ("Transcend SSD", "transcend-ssd", "power-banks", "Transcend"),
    ("boAt PB40", "boat-pb40", "power-banks", "boAt"),
    ("Realme 65W", "realme-65w", "power-banks", "Realme"),
    ("Anker 737 Power Bank", "anker-737-power-bank", "power-banks", "Anker"),
    ("Mi 50000mAh", "mi-50000mah", "power-banks", "Xiaomi"),

    # Smartphones (20 products)
    ("Samsung Galaxy S24", "samsung-galaxy-s24", "smartphones", "Samsung"),
    ("iPhone 15 Pro", "iphone-15-pro", "smartphones", "Apple"),
    ("Xiaomi 14 Ultra", "xiaomi-14-ultra", "smartphones", "Xiaomi"),
    ("OnePlus 12", "oneplus-12", "smartphones", "OnePlus"),
    ("Realme 12 Pro", "realme-12-pro", "smartphones", "Realme"),
    ("Vivo X100", "vivo-x100", "smartphones", "Vivo"),
    ("Oppo Reno 11", "oppo-reno-11", "smartphones", "Oppo"),
    ("Motorola Edge 50", "motorola-edge-50", "smartphones", "Motorola"),
    ("Nothing Phone 2", "nothing-phone-2", "smartphones", "Nothing"),
    ("Samsung Galaxy A54", "samsung-galaxy-a54", "smartphones", "Samsung"),
    ("iPhone 15", "iphone-15", "smartphones", "Apple"),
    ("Xiaomi 13T", "xiaomi-13t", "smartphones", "Xiaomi"),
    ("OnePlus 11T", "oneplus-11t", "smartphones", "OnePlus"),
    ("Realme 11 Pro+", "realme-11-pro-plus", "smartphones", "Realme"),
    ("Vivo V29 Pro", "vivo-v29-pro", "smartphones", "Vivo"),
    ("Oppo A78", "oppo-a78", "smartphones", "Oppo"),
    ("Motorola G54", "motorola-g54", "smartphones", "Motorola"),
    ("Poco F5 Pro", "poco-f5-pro", "smartphones", "Poco"),
    ("HONOR 90", "honor-90", "smartphones", "HONOR"),
    ("Google Pixel 8", "google-pixel-8", "smartphones", "Google"),

    # Tablets (10 products)
    ("Samsung Galaxy Tab S9", "samsung-galaxy-tab-s9", "tablets", "Samsung"),
    ("iPad Pro 12.9", "ipad-pro-129", "tablets", "Apple"),
    ("Xiaomi Pad 6 Pro", "xiaomi-pad-6-pro", "tablets", "Xiaomi"),
    ("Realme Pad 2", "realme-pad-2", "tablets", "Realme"),
    ("OnePlus Pad", "oneplus-pad", "tablets", "OnePlus"),
    ("Lenovo Tab P12", "lenovo-tab-p12", "tablets", "Lenovo"),
    ("HONOR Pad 8", "honor-pad-8", "tablets", "HONOR"),
    ("Oppo Pad 2", "oppo-pad-2", "tablets", "Oppo"),
    ("Vivo Pad", "vivo-pad", "tablets", "Vivo"),
    ("Amazon Fire HD 10", "amazon-fire-hd-10", "tablets", "Amazon"),

    # Cameras (10 products)
    ("Canon EOS R8", "canon-eos-r8", "cameras", "Canon"),
    ("Sony A6700", "sony-a6700", "cameras", "Sony"),
    ("Nikon Z6 III", "nikon-z6-iii", "cameras", "Nikon"),
    ("Fujifilm X-T5", "fujifilm-x-t5", "cameras", "Fujifilm"),
    ("Panasonic S5II", "panasonic-s5ii", "cameras", "Panasonic"),
    ("DJI Osmo Action 4", "dji-osmo-action-4", "cameras", "DJI"),
    ("GoPro Hero 12", "gopro-hero-12", "cameras", "GoPro"),
    ("Insta360 X4", "insta360-x4", "cameras", "Insta360"),
    ("Ricoh Theta Z1X", "ricoh-theta-z1x", "cameras", "Ricoh"),
    ("Blackmagic Pocket 6K", "blackmagic-pocket-6k", "cameras", "Blackmagic"),

    # Laptops (10 products)
    ("MacBook Pro 16", "macbook-pro-16", "laptops", "Apple"),
    ("Dell XPS 15", "dell-xps-15", "laptops", "Dell"),
    ("HP Spectre x360", "hp-spectre-x360", "laptops", "HP"),
    ("ASUS ZenBook 14", "asus-zenbook-14", "laptops", "ASUS"),
    ("Lenovo ThinkPad X1 Carbon", "lenovo-thinkpad-x1", "laptops", "Lenovo"),
    ("MSI GE66 Raider", "msi-ge66-raider", "laptops", "MSI"),
    ("Razer Blade 16", "razer-blade-16", "laptops", "Razer"),
    ("Samsung Galaxy Book3 Pro", "samsung-galaxy-book3", "laptops", "Samsung"),
    ("OnePlus Pad Pro", "oneplus-pad-pro", "laptops", "OnePlus"),
    ("Google Pixelbook Go", "google-pixelbook-go", "laptops", "Google"),

    # Smartbands (10 products)
    ("Mi Band 8 Pro", "mi-band-8-pro", "smartbands", "Xiaomi"),
    ("Noise Icon Fit", "noise-icon-fit", "smartbands", "Noise"),
    ("Realme Band", "realme-band", "smartbands", "Realme"),
    ("boAt Wristfit Pro", "boat-wristfit-pro", "smartbands", "boAt"),
    ("Fire-Boltt Visfit Pro", "fire-boltt-visfit-pro", "smartbands", "Fire-Boltt"),
    ("OnePlus Band", "oneplus-band", "smartbands", "OnePlus"),
    ("Oppo Band", "oppo-band", "smartbands", "Oppo"),
    ("Vivo Band 3", "vivo-band-3", "smartbands", "Vivo"),
    ("HONOR Band 8", "honor-band-8", "smartbands", "HONOR"),
    ("Samsung Fit3", "samsung-fit3", "smartbands", "Samsung"),
]


async def seed_database():
    """Insert 210 products with better category distribution."""
    engine = create_async_engine(settings.database_url, echo=False)

    # Create tables first
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        created = 0
        for product_name, slug, category, brand in SEED_PRODUCTS:
            try:
                product = await repos.products.create(
                    session,
                    name=product_name,
                    slug=slug,
                    category=category,
                    brand=brand,
                    locale="in",
                )
                created += 1
            except Exception as e:
                print(f"✗ {product_name}: {str(e)[:80]}")

        await session.commit()
        print(f"\n✅ Seeded {created}/{len(SEED_PRODUCTS)} products")

        # Show distribution
        from sqlalchemy import select, func
        result = await session.execute(
            select(
                product.category,
                func.count(product.id).label('count')
            ).group_by(product.category).order_by(func.count(product.id).desc())
        )
        print("\n📊 New Distribution:")
        for row in result:
            print(f"  {row[0]:25} {row[1]:3} products")


if __name__ == "__main__":
    asyncio.run(seed_database())
