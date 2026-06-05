"""Repository for affiliate links management."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import AffiliateLinksModel
from uuid import UUID


async def create_affiliate_link(
    session: AsyncSession,
    product_id: UUID,
    amazon_url: str,
    tracking_code: str | None = None,
) -> AffiliateLinksModel:
    """Create an affiliate link for a product."""
    link = AffiliateLinksModel(
        product_id=product_id,
        amazon_url=amazon_url,
        tracking_code=tracking_code,
    )
    session.add(link)
    await session.flush()
    return link


async def get_by_product_id(
    session: AsyncSession,
    product_id: UUID,
) -> AffiliateLinksModel | None:
    """Get affiliate link for a product."""
    stmt = select(AffiliateLinksModel).where(AffiliateLinksModel.product_id == product_id)
    result = await session.execute(stmt)
    return result.scalars().first()


async def record_click(
    session: AsyncSession,
    product_id: UUID,
) -> AffiliateLinksModel | None:
    """Record a click on an affiliate link."""
    link = await get_by_product_id(session, product_id)
    if link:
        link.click_count = (link.click_count or 0) + 1
        await session.flush()
    return link


async def get_all_for_products(
    session: AsyncSession,
    product_ids: list[UUID],
) -> dict[str, AffiliateLinksModel]:
    """Get affiliate links for multiple products."""
    if not product_ids:
        return {}

    stmt = select(AffiliateLinksModel).where(
        AffiliateLinksModel.product_id.in_(product_ids)
    )
    result = await session.execute(stmt)
    links = result.scalars().all()

    return {str(link.product_id): link for link in links}
