"""Pydantic models for the Sri Lanka Travel Recommendation API."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TravelStyle(str, Enum):
    """Available travel styles."""

    ADVENTURE = "Adventure"
    CULTURAL = "Cultural"
    SPIRITUAL = "Spiritual"
    NATURE_WILDLIFE = "Nature/Wildlife"


class StartLocation(str, Enum):
    """Available starting locations."""

    COLOMBO_PORT = "Colombo Port"
    GALLE_PORT = "Galle Port"
    KANDY = "Kandy"
    ANURADHAPURA = "Anuradhapura"


class TravelPreferenceRequest(BaseModel):
    """Input model for recommendation requests."""

    model_config = ConfigDict(populate_by_name=True)

    travel_styles: list[str] = Field(..., alias="travelStyles", min_length=1)
    days: int = Field(..., ge=1, le=14)
    start_location: str = Field(..., alias="startLocation")
    budget: int = Field(..., ge=0)
    members: int = Field(default=1, alias="members", ge=1)


class DayItinerary(BaseModel):
    """Model for a single day's itinerary."""

    model_config = ConfigDict(populate_by_name=True)

    locations: list[str]
    description: str
    meals: str
    accommodation: Optional[str] = None
    transport: str


class EstimatedCost(BaseModel):
    """Model for estimated costs breakdown."""

    model_config = ConfigDict(populate_by_name=True)

    entrance_fees: int = Field(..., alias="entranceFees")
    meals: int
    transport: int
    accommodation: Optional[int] = None
    guide: Optional[int] = None
    total: int


class TravelRecommendation(BaseModel):
    """Model for a single travel recommendation."""

    model_config = ConfigDict(populate_by_name=True)

    id: int
    travel_styles: list[str] = Field(..., alias="travelStyles")
    days: int
    start_location: str = Field(..., alias="startLocation")
    budget: int
    budget_category: str = Field(..., alias="budgetCategory")
    itinerary: dict[str, DayItinerary]
    estimated_cost: EstimatedCost = Field(..., alias="estimatedCost")
    highlights: list[str]
    score: Optional[float] = None


class RecommendationResponse(BaseModel):
    """Response wrapper for recommendations endpoint."""

    model_config = ConfigDict(populate_by_name=True)

    success: bool
    total_results: int = Field(..., alias="totalResults")
    recommendations: list[TravelRecommendation]


class LocationInfo(BaseModel):
    """Model for location data."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    district: str
    time_required: int = Field(..., alias="timeRequired")
    entrance_fee: int = Field(..., alias="entranceFee")
    description: str
    coordinates: tuple[float, float] | None = Field(None, description="[latitude, longitude]")


class StartLocationInfo(BaseModel):
    """Model for start location data with coordinates."""

    model_config = ConfigDict(populate_by_name=True)

    id: int
    name: str
    coordinates: tuple[float, float] | None = Field(None, description="[latitude, longitude]")


class BudgetRange(BaseModel):
    """Model for budget range information."""

    model_config = ConfigDict(populate_by_name=True)

    min: int
    max: int
    label: str
