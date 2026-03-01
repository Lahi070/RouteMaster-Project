"""User-related Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""
    
    email: EmailStr
    username: str
    full_name: str | None = None


class UserResponse(UserBase):
    """User response schema (public data)."""
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: int
    role: str
    is_active: bool = Field(..., alias="isActive")
    is_verified: bool = Field(..., alias="isVerified")
    created_at: datetime = Field(..., alias="createdAt")
    last_login: datetime | None = Field(None, alias="lastLogin")


class UserUpdate(BaseModel):
    """User update request."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    full_name: str | None = Field(None, alias="fullName")
    email: EmailStr | None = None
    username: str | None = None


class UserPreferenceResponse(BaseModel):
    """User travel preferences response."""
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: int
    user_id: int = Field(..., alias="userId")
    preferred_travel_styles: dict | None = Field(None, alias="preferredTravelStyles")
    preferred_budget_range: str | None = Field(None, alias="preferredBudgetRange")
    preferred_start_location: str | None = Field(None, alias="preferredStartLocation")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class UserPreferenceUpdate(BaseModel):
    """User preferences update request."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    preferred_travel_styles: list[str] | None = Field(None, alias="preferredTravelStyles")
    preferred_budget_range: str | None = Field(None, alias="preferredBudgetRange")
    preferred_start_location: str | None = Field(None, alias="preferredStartLocation")


class SavedItineraryResponse(BaseModel):
    """Saved itinerary response."""
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: int
    user_id: int = Field(..., alias="userId")
    itinerary: dict
    title: str | None = None
    notes: str | None = None
    is_favorite: bool = Field(..., alias="isFavorite")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class SavedItineraryCreate(BaseModel):
    """Create saved itinerary request."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    itinerary: dict | None = None
    title: str | None = None
    notes: str | None = None
    is_favorite: bool = Field(default=False, alias="isFavorite")


class SavedItineraryUpdate(BaseModel):
    """Update saved itinerary request."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    title: str | None = None
    notes: str | None = None
    is_favorite: bool | None = Field(None, alias="isFavorite")
