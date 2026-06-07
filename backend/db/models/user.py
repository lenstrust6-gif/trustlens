"""User models for authentication and profile management."""
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from datetime import datetime

from backend.db.base import Base


class User(Base):
    """User model for OAuth authentication."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    image = Column(String(500), nullable=True)

    # OAuth provider info
    provider = Column(String(50), nullable=False, default="google")  # google, github, etc
    provider_account_id = Column(String(255), nullable=False)  # OAuth provider's user ID

    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    saved_products = relationship("SavedProduct", back_populates="user", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        UniqueConstraint("provider", "provider_account_id", name="uq_provider_account"),
    )

    def __repr__(self):
        return f"<User {self.email}>"


class UserSession(Base):
    """Session tracking for authenticated users."""
    __tablename__ = "user_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Session token (JWT)
    token = Column(String(1000), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="sessions")

    def is_valid(self) -> bool:
        """Check if session is still valid."""
        return datetime.utcnow() < self.expires_at

    def __repr__(self):
        return f"<UserSession {self.user_id}>"


class SavedProduct(Base):
    """User's saved/favorited products."""
    __tablename__ = "saved_products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(String(36), nullable=False, index=True)  # Reference to product UUID

    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="saved_products")

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_user_product"),
    )

    def __repr__(self):
        return f"<SavedProduct {self.user_id}:{self.product_id}>"
