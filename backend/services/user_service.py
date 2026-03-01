"""User service for user-related operations."""

from typing import Optional

from sqlalchemy.orm import Session

from core.exceptions import ConflictError, NotFoundError
from core.security import hash_password
from database.models import SavedItinerary, User, UserActivityLog, UserPreference
from schemas.user import SavedItineraryCreate, UserPreferenceUpdate


class UserService:
    """Service for user CRUD operations."""
    
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def create_user(
        db: Session,
        email: str,
        username: str,
        password: str,
        full_name: Optional[str] = None,
    ) -> User:
        """
        Create a new user.
        
        Args:
            db: Database session
            email: User email
            username: Username
            password: Plain text password
            full_name: User's full name
        
        Returns:
            Created User object
        
        Raises:
            ConflictError: If email or username already exists
        """
        # Check if email exists
        if UserService.get_by_email(db, email):
            raise ConflictError("Email already registered")
        
        # Check if username exists
        if UserService.get_by_username(db, username):
            raise ConflictError("Username already taken")
        
        # Create user
        db_user = User(
            email=email,
            username=username,
            password_hash=hash_password(password),
            full_name=full_name,
            role="user",
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def update_user(
        db: Session,
        user_id: int,
        email: Optional[str] = None,
        username: Optional[str] = None,
        full_name: Optional[str] = None,
    ) -> User:
        """
        Update user information.
        
        Args:
            db: Database session
            user_id: User ID
            email: New email (optional)
            username: New username (optional)
            full_name: New full name (optional)
        
        Returns:
            Updated User object
        
        Raises:
            NotFoundError: If user not found
            ConflictError: If email/username already exists
        """
        db_user = UserService.get_by_id(db, user_id)
        if not db_user:
            raise NotFoundError("User not found")
        
        # Check email conflict
        if email and email != db_user.email:
            if UserService.get_by_email(db, email):
                raise ConflictError("Email already registered")
            db_user.email = email
        
        # Check username conflict
        if username and username != db_user.username:
            if UserService.get_by_username(db, username):
                raise ConflictError("Username already taken")
            db_user.username = username
        
        if full_name is not None:
            db_user.full_name = full_name
        
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Delete a user."""
        db_user = UserService.get_by_id(db, user_id)
        if db_user:
            db.delete(db_user)
            db.commit()
            return True
        return False
    
    @staticmethod
    def log_activity(
        db: Session,
        user_id: int,
        action: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> UserActivityLog:
        """Log user activity."""
        log = UserActivityLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    
    # Preferences
    
    @staticmethod
    def get_preferences(db: Session, user_id: int) -> Optional[UserPreference]:
        """Get user preferences."""
        return db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    @staticmethod
    def update_preferences(
        db: Session,
        user_id: int,
        preferences: UserPreferenceUpdate,
    ) -> UserPreference:
        """Update or create user preferences."""
        db_pref = UserService.get_preferences(db, user_id)
        
        if not db_pref:
            # Create new preferences
            db_pref = UserPreference(user_id=user_id)
            db.add(db_pref)
        
        # Update fields
        if preferences.preferred_travel_styles is not None:
            db_pref.preferred_travel_styles = {"styles": preferences.preferred_travel_styles}
        
        if preferences.preferred_budget_range is not None:
            db_pref.preferred_budget_range = preferences.preferred_budget_range
        
        if preferences.preferred_start_location is not None:
            db_pref.preferred_start_location = preferences.preferred_start_location
        
        db.commit()
        db.refresh(db_pref)
        
        return db_pref
    
    # Saved Itineraries
    
    @staticmethod
    def get_saved_itineraries(db: Session, user_id: int) -> list[SavedItinerary]:
        """Get all saved itineraries for a user."""
        return (
            db.query(SavedItinerary)
            .filter(SavedItinerary.user_id == user_id)
            .order_by(SavedItinerary.created_at.desc())
            .all()
        )
    
    @staticmethod
    def save_itinerary(
        db: Session,
        user_id: int,
        data: SavedItineraryCreate,
    ) -> SavedItinerary:
        """Save a travel itinerary."""
        
        
        db_itinerary = SavedItinerary(
            user_id=user_id,
            itinerary=data.itinerary,
            title=data.title,
            notes=data.notes,
            is_favorite=data.is_favorite,
        )
        
        db.add(db_itinerary)
        db.commit()
        db.refresh(db_itinerary)
        
        return db_itinerary
    
    @staticmethod
    def delete_saved_itinerary(db: Session, user_id: int, itinerary_id: int) -> bool:
        """Delete a saved itinerary."""
        db_itinerary = (
            db.query(SavedItinerary)
            .filter(
                SavedItinerary.id == itinerary_id,
                SavedItinerary.user_id == user_id,
            )
            .first()
        )
        
        if db_itinerary:
            db.delete(db_itinerary)
            db.commit()
            return True
        
        return False
