from sqlalchemy import Column, String, Integer, Text, Numeric, DateTime, Boolean, ForeignKey, JSON, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class ProductModel(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    asin = Column(String(20))
    locale = Column(String(5), nullable=False)  # 'in', 'us', 'uk'
    category = Column(String(100))
    brand = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())


class VerdictModel(Base):
    __tablename__ = "verdicts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    trust_score = Column(DECIMAL(3, 1))
    summary = Column(Text)
    pros = Column(JSON)
    cons = Column(JSON)
    best_for = Column(JSON)
    avoid_if = Column(JSON)
    feature_scores = Column(JSON)
    spec_tags = Column(JSON)
    confidence_tier = Column(String(20))
    source_count_yt = Column(Integer, default=0)
    source_count_amz = Column(Integer, default=0)
    auth_score_avg = Column(DECIMAL(4, 1))
    reviews_excluded = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime)
    refresh_trigger = Column(String(50))


class ReviewHighlightModel(Base):
    __tablename__ = "review_highlights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verdict_id = Column(UUID(as_uuid=True), ForeignKey("verdicts.id", ondelete="CASCADE"), nullable=False)
    source = Column(String(20))  # 'youtube' or 'amazon'
    text = Column(Text)
    rating = Column(DECIMAL(2, 1))
    auth_score = Column(Integer)
    helpful_count = Column(Integer, default=0)
    reviewer_meta = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())


class SearchMissModel(Base):
    __tablename__ = "search_misses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query = Column(String(255), nullable=False)
    locale = Column(String(5))
    count = Column(Integer, default=1)
    last_searched = Column(DateTime, server_default=func.now())


class EmailCaptureModel(Base):
    __tablename__ = "email_captures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False)
    product_name = Column(String(255))
    locale = Column(String(5))
    notified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class EmailModel(Base):
    __tablename__ = "emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    verdict_id = Column(UUID(as_uuid=True), ForeignKey("verdicts.id", ondelete="SET NULL"))
    email_capture_id = Column(UUID(as_uuid=True), ForeignKey("email_captures.id", ondelete="SET NULL"))
    status = Column(String(50), default="pending")  # pending, sent, failed, bounced
    resend_id = Column(String(255))  # ID from Resend API
    error_message = Column(Text)
    sent_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())


class VerdictRatingModel(Base):
    __tablename__ = "verdict_ratings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verdict_id = Column(UUID(as_uuid=True), ForeignKey("verdicts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(255))  # Can be anonymous (None) or auth user ID
    helpful = Column(Boolean, nullable=False)  # True = helpful, False = not helpful
    ip_address = Column(String(45))  # IPv4 or IPv6 for rate limiting
    created_at = Column(DateTime, server_default=func.now())
