from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import ProductModel
from backend.models.product import Product
import uuid


async def get_by_slug(session: AsyncSession, slug: str, locale: str) -> Product | None:
    """Get product by slug and locale."""
    stmt = select(ProductModel).where(
        ProductModel.slug == slug, ProductModel.locale == locale
    )
    result = await session.execute(stmt)
    product = result.scalars().first()
    if product:
        return Product.model_validate(product)
    return None


async def create(
    session: AsyncSession,
    name: str,
    slug: str,
    locale: str,
    asin: str | None = None,
    category: str | None = None,
    brand: str | None = None,
) -> Product:
    """Create a new product."""
    product = ProductModel(
        id=uuid.uuid4(),
        name=name,
        slug=slug,
        locale=locale,
        asin=asin,
        category=category,
        brand=brand,
    )
    session.add(product)
    await session.flush()
    return Product.model_validate(product)


async def get_all(session: AsyncSession) -> list[Product]:
    """Get all products."""
    stmt = select(ProductModel).order_by(ProductModel.created_at.desc())
    result = await session.execute(stmt)
    products = result.scalars().all()
    return [Product.model_validate(p) for p in products]
