"""User routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.deps import get_current_user
from core.exceptions import NotFoundError
from database import get_db
from database.models import User
from schemas.common import MessageResponse
from schemas.user import (
    SavedItineraryCreate,
    SavedItineraryResponse,
    UserPreferenceResponse,
    UserPreferenceUpdate,
    UserResponse,
    UserUpdate,
)
from services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user's profile.
    
    Requires authentication.
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's profile.
    
    - **fullName**: Update full name
    - **email**: Update email (must be unique)
    - **username**: Update username (must be unique)
    
    Requires authentication.
    """
    updated_user = UserService.update_user(
        db=db,
        user_id=current_user.id,
        email=data.email,
        username=data.username,
        full_name=data.full_name,
    )
    
    return UserResponse.model_validate(updated_user)


@router.delete("/me", response_model=MessageResponse)
async def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete current user's account.
    
    This action is permanent and cannot be undone.
    
    Requires authentication.
    """
    UserService.delete_user(db, current_user.id)
    
    return MessageResponse(message="Account deleted successfully")


# Preferences


@router.get("/me/preferences", response_model=UserPreferenceResponse | None)
async def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get current user's travel preferences.
    
    Returns null if no preferences set yet.
    
    Requires authentication.
    """
    preferences = UserService.get_preferences(db, current_user.id)
    
    if not preferences:
        return None
    
    return UserPreferenceResponse.model_validate(preferences)


@router.put("/me/preferences", response_model=UserPreferenceResponse)
async def update_my_preferences(
    data: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's travel preferences.
    
    - **preferredTravelStyles**: Array of preferred travel styles
    - **preferredBudgetRange**: Preferred budget category
    - **preferredStartLocation**: Preferred starting location
    
    Requires authentication.
    """
    preferences = UserService.update_preferences(db, current_user.id, data)
    
    return UserPreferenceResponse.model_validate(preferences)


# Saved Itineraries


@router.get("/me/saved-itineraries", response_model=list[SavedItineraryResponse])
async def get_my_saved_itineraries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all saved itineraries for current user.
    
    Returns list of saved travel itineraries with notes and favorites.
    
    Requires authentication.
    """
    itineraries = UserService.get_saved_itineraries(db, current_user.id)
    
    return [SavedItineraryResponse.model_validate(it) for it in itineraries]


@router.post("/me/saved-itineraries", response_model=SavedItineraryResponse)
async def save_itinerary(
    data: SavedItineraryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save a travel itinerary.
    
    - **combinationId**: ID of the travel combination to save
    - **title**: Optional custom title
    - **notes**: Optional notes
    - **isFavorite**: Mark as favorite
    
    Requires authentication.
    """
    itinerary = UserService.save_itinerary(db, current_user.id, data)
    
    return SavedItineraryResponse.model_validate(itinerary)


@router.delete("/me/saved-itineraries/{itinerary_id}", response_model=MessageResponse)
async def delete_saved_itinerary(
    itinerary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a saved itinerary.
    
    Requires authentication and ownership of the itinerary.
    """
    deleted = UserService.delete_saved_itinerary(db, current_user.id, itinerary_id)
    
    if not deleted:
        raise NotFoundError("Saved itinerary not found")
    
    return MessageResponse(message="Itinerary deleted successfully")
