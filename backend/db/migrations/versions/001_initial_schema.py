"""Create initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # products table
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('asin', sa.String(20)),
        sa.Column('locale', sa.String(5), nullable=False),
        sa.Column('category', sa.String(100)),
        sa.Column('brand', sa.String(100)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug', 'locale'),
    )

    # verdicts table
    op.create_table(
        'verdicts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('trust_score', sa.Numeric(precision=3, scale=1)),
        sa.Column('summary', sa.Text()),
        sa.Column('pros', postgresql.JSON()),
        sa.Column('cons', postgresql.JSON()),
        sa.Column('best_for', postgresql.JSON()),
        sa.Column('avoid_if', postgresql.JSON()),
        sa.Column('feature_scores', postgresql.JSON()),
        sa.Column('spec_tags', postgresql.JSON()),
        sa.Column('confidence_tier', sa.String(20)),
        sa.Column('source_count_yt', sa.Integer(), default=0),
        sa.Column('source_count_amz', sa.Integer(), default=0),
        sa.Column('auth_score_avg', sa.Numeric(precision=4, scale=1)),
        sa.Column('reviews_excluded', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime()),
        sa.Column('refresh_trigger', sa.String(50)),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # review_highlights table
    op.create_table(
        'review_highlights',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('verdict_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source', sa.String(20)),
        sa.Column('text', sa.Text()),
        sa.Column('rating', sa.Numeric(precision=2, scale=1)),
        sa.Column('auth_score', sa.Integer()),
        sa.Column('helpful_count', sa.Integer(), default=0),
        sa.Column('reviewer_meta', postgresql.JSON()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['verdict_id'], ['verdicts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # search_misses table
    op.create_table(
        'search_misses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('query', sa.String(255), nullable=False),
        sa.Column('locale', sa.String(5)),
        sa.Column('count', sa.Integer(), default=1),
        sa.Column('last_searched', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('query', 'locale'),
    )

    # email_captures table
    op.create_table(
        'email_captures',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('product_name', sa.String(255)),
        sa.Column('locale', sa.String(5)),
        sa.Column('notified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('email_captures')
    op.drop_table('search_misses')
    op.drop_table('review_highlights')
    op.drop_table('verdicts')
    op.drop_table('products')
