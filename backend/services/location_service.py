"""Location service for CRUD operations."""

from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.exceptions import ConflictError, NotFoundError
from database.models import Location
from schemas.location import LocationCreate, LocationUpdate


class LocationService:
    """Service for managing location data."""
    
    @staticmethod
    def get_by_id(db: Session, location_id: int) -> Optional[Location]:
        """
        Get a location by ID.
        
        Args:
            db: Database session
            location_id: Location ID
            
        Returns:
            Location or None if not found
        """
        return db.query(Location).filter(Location.id == location_id).first()
    
    @staticmethod
    def get_by_string_id(db: Session, string_id: str) -> Optional[Location]:
        """
        Get a location by string ID.
        
        Args:
            db: Database session
            string_id: Location string ID
            
        Returns:
            Location or None if not found
        """
        return db.query(Location).filter(Location.string_id == string_id).first()
    
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        district: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Location], int]:
        """
        Get all locations with optional filtering.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            category: Filter by category
            district: Filter by district
            search: Search term for name or description
            
        Returns:
            Tuple of (locations list, total count)
        """
        query = db.query(Location)
        
        # Apply filters
        if category:
            query = query.filter(Location.category == category)
        
        if district:
            query = query.filter(Location.district == district)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Location.name.ilike(search_pattern),
                    Location.description.ilike(search_pattern),
                    Location.string_id.ilike(search_pattern),
                )
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply pagination and order
        locations = query.order_by(Location.name).offset(skip).limit(limit).all()
        
        return locations, total
    
    @staticmethod
    def create(db: Session, location_data: LocationCreate) -> Location:
        """
        Create a new location.
        
        Args:
            db: Database session
            location_data: Location creation data
            
        Returns:
            Created location
            
        Raises:
            ConflictError: If string_id already exists
        """
        # Check if string_id already exists
        existing = LocationService.get_by_string_id(db, location_data.string_id)
        if existing:
            raise ConflictError(
                f"Location with string_id '{location_data.string_id}' already exists"
            )
        
        # Create new location
        location = Location(
            string_id=location_data.string_id,
            name=location_data.name,
            category=location_data.category,
            district=location_data.district,
            time_required=location_data.time_required,
            entrance_fee=location_data.entrance_fee,
            description=location_data.description,
            coordinates=location_data.coordinates,
        )
        
        try:
            db.add(location)
            db.commit()
            db.refresh(location)
            return location
        except IntegrityError as e:
            db.rollback()
            raise ConflictError(f"Database constraint violation: {str(e)}")
    
    @staticmethod
    def update(
        db: Session, location_id: int, location_data: LocationUpdate
    ) -> Location:
        """
        Update an existing location.
        
        Args:
            db: Database session
            location_id: Location ID to update
            location_data: Location update data
            
        Returns:
            Updated location
            
        Raises:
            NotFoundError: If location not found
            ConflictError: If string_id conflicts with another location
        """
        location = LocationService.get_by_id(db, location_id)
        if not location:
            raise NotFoundError(f"Location with ID {location_id} not found")
        
        # Update only provided fields
        update_dict = location_data.model_dump(exclude_unset=True)
        
        # Check string_id uniqueness if being updated
        if "string_id" in update_dict:
            existing = LocationService.get_by_string_id(db, update_dict["string_id"])
            if existing and existing.id != location_id:
                raise ConflictError(
                    f"Location with string_id '{update_dict['string_id']}' already exists"
                )
        
        for field, value in update_dict.items():
            setattr(location, field, value)
        
        try:
            db.commit()
            db.refresh(location)
            return location
        except IntegrityError as e:
            db.rollback()
            raise ConflictError(f"Database constraint violation: {str(e)}")
    
    @staticmethod
    def delete(db: Session, location_id: int) -> None:
        """
        Delete a location.
        
        Args:
            db: Database session
            location_id: Location ID to delete
            
        Raises:
            NotFoundError: If location not found
        """
        location = LocationService.get_by_id(db, location_id)
        if not location:
            raise NotFoundError(f"Location with ID {location_id} not found")
        
        db.delete(location)
        db.commit()
    
    @staticmethod
    def get_categories(db: Session) -> List[str]:
        """
        Get all unique categories.
        
        Args:
            db: Database session
            
        Returns:
            List of unique category names
        """
        categories = db.query(Location.category).distinct().order_by(Location.category).all()
        return [cat[0] for cat in categories]
    
    @staticmethod
    def get_districts(db: Session) -> List[str]:
        """
        Get all unique districts.
        
        Args:
            db: Database session
            
        Returns:
            List of unique district names
        """
        districts = db.query(Location.district).distinct().order_by(Location.district).all()
        return [dist[0] for dist in districts]
