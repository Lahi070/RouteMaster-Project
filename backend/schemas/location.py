"""Location-related Pydantic schemas."""

from datetime import datetime
from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LocationBase(BaseModel):
    """Base location schema."""
    
    string_id: str = Field(..., alias="stringId", description="Unique string identifier for the location")
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=50)
    district: str = Field(..., min_length=1, max_length=100)
    time_required: int = Field(..., alias="timeRequired", ge=0, description="Time required in hours")
    entrance_fee: int = Field(..., alias="entranceFee", ge=0, description="Entrance fee in currency")
    description: str = Field(..., min_length=1)
    coordinates: Optional[Union[dict, list]] = Field(None, description="Lat/lng coordinates (dict or list)")
    
    @field_validator("coordinates", mode="before")
    @classmethod
    def normalize_coordinates(cls, v: Any) -> Optional[Union[dict, list]]:
        """Normalize coordinates to ensure consistency."""
        if v is None:
            return None
        if isinstance(v, str):
            import json
            try:
                # Try to parse the string as JSON
                return json.loads(v)
            except json.JSONDecodeError:
                return None
            
        # Accept both list and dict formats
        return v


class LocationCreate(LocationBase):
    """Schema for creating a new location."""
    
    model_config = ConfigDict(populate_by_name=True)


class LocationUpdate(BaseModel):
    """Schema for updating a location (all fields optional)."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    string_id: Optional[str] = Field(None, alias="stringId")
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    district: Optional[str] = Field(None, min_length=1, max_length=100)
    time_required: Optional[int] = Field(None, alias="timeRequired", ge=0)
    entrance_fee: Optional[int] = Field(None, alias="entranceFee", ge=0)
    description: Optional[str] = Field(None, min_length=1)
    coordinates: Optional[Union[dict, list]] = None


class LocationResponse(LocationBase):
    """Location response schema."""
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: int


class LocationListResponse(BaseModel):
    """Response for listing locations."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    total: int
    locations: list[LocationResponse]


class LocationQueryParams(BaseModel):
    """Query parameters for filtering locations."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    category: Optional[str] = None
    district: Optional[str] = None
    search: Optional[str] = None
    skip: int = Field(0, ge=0)
    limit: int = Field(100, ge=1, le=500)
