"""Travel recommendation routes."""

import logging
from typing import Optional

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from api.deps import get_optional_user
from config import settings
from database import get_db
from database.models import User
from models import BudgetRange, LocationInfo, StartLocationInfo, TravelPreferenceRequest, TravelRecommendation
from recommendation_engine import RecommendationEngine
from schemas.user import UserPreferenceResponse
from services.user_service import UserService

router = APIRouter(prefix="/api/v1", tags=["Recommendations"])

# Initialize recommendation engine (used as fallback)
engine = RecommendationEngine()


from services.ml_recommender import get_recommender
from services.itinerary_builder import build_itinerary

@router.post("/recommendations", response_model=dict)
async def get_recommendations(
    data: TravelPreferenceRequest,
    limit: int = 10,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Get ML-powered travel recommendations.

    - **travel_styles**: List of preferred travel styles
    - **days**: Number of travel days (1-14)
    - **start_location**: Starting point
    - **budget**: Maximum budget in LKR
    - **limit**: Maximum number of results (default: 10)
    """

    user_id = current_user.id if current_user else None
    logger.info(f"Generating ML recommendations for user: {user_id}")

    # Initialize the local recommender
    recommender = get_recommender()

    # Map frontend travel_styles to activities expected by the ML model
    # Example style string to activity string mapping:
    # "Cultural" -> "historical sites", "temples"
    # "Adventure" -> "hiking", "water sports"
    # "Nature/Wildlife" -> "wild life safaris", "national parks"
    style_to_activity_map = {
        "Cultural": ["historic sites", "historical monuments", "architecture tours", "arts and culture", "history tours"],
        "Adventure": ["hiking", "surfing", "rock climbing", "outdoor adventures", "caving"],
        "Nature/Wildlife": ["wildlife viewing", "wild life safaris", "bird watching", "nature walks", "snorkeling"],
        "Spiritual": ["temple pilgrimages", "meditation", "spiritual retreats"]
    }

    user_activities = []
    for style in data.travel_styles:
        if style in style_to_activity_map:
            user_activities.extend(style_to_activity_map[style])
        else:
            user_activities.append(style.lower())
    
    # Map start locations to nearest actual notable place in the dataset to seed the route
    start_loc_map = {
        "Colombo Port": "Galle Face Green",  # Closest notable place in typical datasets
        "Galle Port": "Galle Fort",
        "Kandy": "Temple of the Sacred Tooth Relic",
        "Anuradhapura": "Anuradhapura New Town"
    }
    
    mapped_start = start_loc_map.get(data.start_location, data.start_location)
    user_bucket_list = [mapped_start]

    from sqlalchemy import text
    try:
        # Run ML model to get best route
        best_route = recommender.recommend_top_places(user_activities, user_bucket_list)
        logger.info(f"ML Model output best_route: {best_route}")
        
        # Verify db connection is still alive after ML processing, 
        # as strict proxies drop idle connections quickly
        try:
            db.execute(text("SELECT 1"))
        except Exception:
            db.rollback()
            # If it fails, FastAPI Depends(get_db) won't auto-reconnect cleanly here 
            # without a retry dependency, but SQLAlchemy's pool_pre_ping 
            # should handle the next query. We issue a dummy query to force it.
            
        # Build structured itinerary matching frontend schemas using the DB locations
        itinerary = build_itinerary(db, list(best_route), data.days, data.travel_styles, data.budget, data.start_location, data.members)
        
        return {
            "success": True,
            "recommendations": [itinerary],
            "total_results": 1,
            "filters_applied": {
                "travel_styles": data.travel_styles,
                "days": data.days,
                "start_location": data.start_location,
                "budget": data.budget
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Error generating recommendation: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations from ML model")


@router.get("/travel-styles", response_model=list[str])
async def get_travel_styles(db: Session = Depends(get_db)):
    """Get all available travel styles."""
    return engine.get_travel_styles(db)


@router.get("/start-locations", response_model=list[StartLocationInfo])
async def get_start_locations(db: Session = Depends(get_db)):
    """Get all available starting locations with coordinates."""
    return engine.get_start_locations(db)


@router.get("/budget-ranges", response_model=dict[str, BudgetRange])
async def get_budget_ranges(db: Session = Depends(get_db)):
    """Get budget range categories with min/max values in LKR."""
    return engine.get_budget_ranges(db)


@router.get("/locations", response_model=list[LocationInfo])
async def get_locations(category: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Get all tourist locations, optionally filtered by category.

    - **category**: Optional filter (cultural, spiritual, adventure, nature_wildlife)
    """
    return engine.get_all_locations(db, category=category)


@router.get("/combinations/{combination_id}", response_model=TravelRecommendation)
async def get_combination_by_id(combination_id: int, db: Session = Depends(get_db)):
    """Get a specific travel combination by its ID."""
    combination = engine.get_combination_by_id(db, combination_id)

    if combination is None:
        raise HTTPException(status_code=404, detail=f"Combination with ID {combination_id} not found")

    return combination


def _get_budget_category(budget: int) -> str:
    """Helper to determine budget category."""
    if budget < 50000:
        return "budget"
    elif budget < 100000:
        return "moderate"
    elif budget < 150000:
        return "luxury"
    else:
        return "premium"
