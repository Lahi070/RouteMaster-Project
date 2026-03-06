"""SQLAlchemy ORM models for the application."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    profile_picture: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        Enum("user", "admin", name="user_role"), 
        default="user", 
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    preferences: Mapped[Optional["UserPreference"]] = relationship(
        "UserPreference", 
        back_populates="user", 
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="[UserPreference.user_id]"
    )
    saved_itineraries: Mapped[List["SavedItinerary"]] = relationship(
        "SavedItinerary", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    password_resets: Mapped[List["PasswordResetToken"]] = relationship(
        "PasswordResetToken", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    activity_logs: Mapped[List["UserActivityLog"]] = relationship(
        "UserActivityLog", 
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"


class RefreshToken(Base):
    """Refresh token model for token-based authentication."""

    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        nullable=False
    )
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.revoked})>"


class UserPreference(Base):
    """User travel preferences model."""

    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False
    )
    preferred_travel_styles: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    preferred_budget_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    preferred_start_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreference(id={self.id}, user_id={self.user_id})>"


class PasswordResetToken(Base):
    """Password reset token model."""

    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        nullable=False
    )
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="password_resets")

    def __repr__(self) -> str:
        return f"<PasswordResetToken(id={self.id}, user_id={self.user_id}, used={self.used})>"


class SavedItinerary(Base):
    """Saved travel itineraries model."""

    __tablename__ = "saved_itineraries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    itinerary: Mapped[dict] = mapped_column(JSON, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="saved_itineraries")

    def __repr__(self) -> str:
        return f"<SavedItinerary(id={self.id}, user_id={self.user_id}, combination_id={self.combination_id})>"


class UserActivityLog(Base):
    """User activity logging model for audit trail."""

    __tablename__ = "user_activity_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        nullable=False,
        index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="activity_logs")

    def __repr__(self) -> str:
        return f"<UserActivityLog(id={self.id}, user_id={self.user_id}, action={self.action})>"


# --- Travel Data Models (migrated from data.json) ---

# Junction table for many-to-many: TravelCombination <-> TravelStyle
combination_travel_styles = Table(
    "combination_travel_styles",
    Base.metadata,
    Column("combination_id", Integer, ForeignKey("travel_combinations.id", ondelete="CASCADE"), primary_key=True),
    Column("travel_style_id", Integer, ForeignKey("travel_styles.id", ondelete="CASCADE"), primary_key=True),
)


class TravelStyle(Base):
    """Available travel style lookup."""

    __tablename__ = "travel_styles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    def __repr__(self) -> str:
        return f"<TravelStyle(id={self.id}, name={self.name})>"


class StartLocation(Base):
    """Available starting location lookup."""

    __tablename__ = "start_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    coordinates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<StartLocation(id={self.id}, name={self.name})"


class BudgetRangeModel(Base):
    """Budget range category lookup."""

    __tablename__ = "budget_ranges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    min_value: Mapped[int] = mapped_column(Integer, nullable=False)
    max_value: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(50), nullable=False)

    def __repr__(self) -> str:
        return f"<BudgetRangeModel(id={self.id}, key={self.key}, label={self.label})>"


class Location(Base):
    """Tourist location model."""

    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    string_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    time_required: Mapped[int] = mapped_column(Integer, nullable=False)
    entrance_fee: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    coordinates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<Location(id={self.id}, string_id={self.string_id}, name={self.name})>"


class TravelCombination(Base):
    """Travel combination / itinerary package."""

    __tablename__ = "travel_combinations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    days: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    start_location: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    budget: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_category: Mapped[str] = mapped_column(String(50), nullable=False)
    itinerary: Mapped[dict] = mapped_column(JSON, nullable=False)
    estimated_cost: Mapped[dict] = mapped_column(JSON, nullable=False)
    highlights: Mapped[list] = mapped_column(JSON, nullable=False)

    # Relationships
    travel_styles: Mapped[List["TravelStyle"]] = relationship(
        "TravelStyle",
        secondary=combination_travel_styles,
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<TravelCombination(id={self.id}, days={self.days}, start_location={self.start_location})>"
