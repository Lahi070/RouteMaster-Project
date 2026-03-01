"""Admin location management routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.deps import require_admin
from database import get_db
from database.models import User
from schemas.common import MessageResponse
from schemas.location import (
    LocationCreate,
    LocationListResponse,
    LocationResponse,
    LocationUpdate,
)
from services.location_service import LocationService

router = APIRouter(prefix="/admin/locations", tags=["Admin - Locations"])


@router.get("", response_model=LocationListResponse)
async def get_locations(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    district: Optional[str] = Query(None, description="Filter by district"),
    search: Optional[str] = Query(None, description="Search in name, description, or string_id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all locations with optional filtering (Admin only).
    
    - **skip**: Number of records to skip for pagination
    - **limit**: Maximum number of records to return (1-500)
    - **category**: Filter by location category
    - **district**: Filter by district name
    - **search**: Search term for name, description, or string_id
    
    Returns list of locations and total count.
    """
    locations, total = LocationService.get_all(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        district=district,
        search=search,
    )
    
    return LocationListResponse(
        total=total,
        locations=[LocationResponse.model_validate(loc) for loc in locations],
    )


@router.get("/categories", response_model=list[str])
async def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all unique location categories (Admin only).
    
    Returns list of category names.
    """
    return LocationService.get_categories(db)


@router.get("/districts", response_model=list[str])
async def get_districts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all unique districts (Admin only).
    
    Returns list of district names.
    """
    return LocationService.get_districts(db)


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get a specific location by ID (Admin only).
    
    - **location_id**: Location ID
    
    Returns location details.
    """
    from core.exceptions import NotFoundError
    
    location = LocationService.get_by_id(db, location_id)
    if not location:
        raise NotFoundError(f"Location with ID {location_id} not found")
    
    return LocationResponse.model_validate(location)


@router.post("", response_model=LocationResponse, status_code=201)
async def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new location (Admin only).
    
    - **stringId**: Unique string identifier for the location
    - **name**: Location name
    - **category**: Category (e.g., Temple, Beach, Wildlife)
    - **district**: District name
    - **timeRequired**: Time required in hours
    - **entranceFee**: Entrance fee in currency
    - **description**: Location description
    - **coordinates**: Optional lat/lng coordinates
    
    Returns created location.
    """
    location = LocationService.create(db, location_data)
    return LocationResponse.model_validate(location)


@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update an existing location (Admin only).
    
    - **location_id**: Location ID to update
    
    All fields are optional. Only provided fields will be updated.
    
    Returns updated location.
    """
    location = LocationService.update(db, location_id, location_data)
    return LocationResponse.model_validate(location)


@router.delete("/{location_id}", response_model=MessageResponse)
async def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a location (Admin only).
    
    - **location_id**: Location ID to delete
    
    Returns success message.
    """
    LocationService.delete(db, location_id)
    return MessageResponse(message=f"Location {location_id} deleted successfully")
