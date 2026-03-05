"""Travel recommendation routes."""

import logging
import traceback
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.deps import get_optional_user
from config import settings
from database import get_db
from database.models import User
from models import (
    BudgetRange,
    LocationInfo,
    StartLocationInfo,
    TravelPreferenceRequest,
    TravelRecommendation,
)
from recommendation_engine import RecommendationEngine
from schemas.recommend import CausalRecommendRequest, CausalRecommendResponse
from schemas.user import UserPreferenceResponse
from services.itinerary_builder import build_itinerary
from services.ml_recommender import get_recommender
from services.user_service import UserService
import services.causal_recommender as causal_svc
import services.optimization_service as opt_svc
import services.explainability_service as explain_svc

logger = logging.getLogger(__name__)

# ── Routers ───────────────────────────────────────────────────────────────────
router       = APIRouter(prefix="/api/v1", tags=["Recommendations"])
causal_router = APIRouter(prefix="/api",   tags=["Causal AI"])

# Legacy engine used by /travel-styles, /start-locations, etc.
engine = RecommendationEngine()

# Style → activity mapping used by the legacy recommend endpoint
_STYLE_TO_ACTIVITY: dict[str, list[str]] = {
    "Cultural":       ["historic sites", "historical monuments", "architecture tours", "arts and culture", "history tours"],
    "Adventure":      ["hiking", "surfing", "rock climbing", "outdoor adventures", "caving"],
    "Nature/Wildlife":["wildlife viewing", "wild life safaris", "bird watching", "nature walks", "snorkeling"],
    "Spiritual":      ["temple pilgrimages", "meditation", "spiritual retreats"],
}

# Start-location → nearest notable place used to seed the ML route
_START_LOC_MAP: dict[str, str] = {
    "Colombo Port": "Galle Face Green",
    "Galle Port":   "Galle Fort",
    "Kandy":        "Temple of the Sacred Tooth Relic",
    "Anuradhapura": "Anuradhapura New Town",
}


# ── Legacy ML Recommendation ──────────────────────────────────────────────────

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

    recommender = get_recommender()

    user_activities = []
    for style in data.travel_styles:
        user_activities.extend(_STYLE_TO_ACTIVITY.get(style, [style.lower()]))

    mapped_start   = _START_LOC_MAP.get(data.start_location, data.start_location)
    user_bucket_list = [mapped_start]

    try:
        best_route = recommender.recommend_top_places(user_activities, user_bucket_list)
        logger.info(f"ML model best_route: {best_route}")

        # Keep DB connection alive (proxies drop idle connections)
        try:
            db.execute(text("SELECT 1"))
        except Exception:
            db.rollback()

        itinerary = build_itinerary(
            db, list(best_route), data.days, data.travel_styles,
            data.budget, data.start_location, data.members,
        )

        return {
            "success":       True,
            "recommendations": [itinerary],
            "total_results": 1,
            "filters_applied": {
                "travel_styles":  data.travel_styles,
                "days":           data.days,
                "start_location": data.start_location,
                "budget":         data.budget,
            },
        }

    except Exception as exc:
        traceback.print_exc()
        logger.error(f"Error generating recommendation: {exc}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations from ML model")


# ── Lookup Endpoints ──────────────────────────────────────────────────────────

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


# ── Causal AI Recommendation ──────────────────────────────────────────────────

@causal_router.post("/recommend", response_model=CausalRecommendResponse)
async def causal_recommend(
    req: CausalRecommendRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    **4-Phase Causal-Aware Recommendation**

    1. Causal inference (Doubly Robust CATE) — removes popularity bias
    2. Gradient Boosting predict_proba — per-destination confidence score
    3. Nearest Neighbour TSP — optimised visiting order
    4. SHAP TreeExplainer — per-destination feature importance
    """
    user_id = current_user.id if current_user else None
    logger.info(f"Causal AI request user={user_id} age={req.age} prefs={req.preferences}")

    try:
        # Phase 1 + 2
        top_dests = causal_svc.recommend(
            age=req.age,
            gender=req.gender,
            preferences=req.preferences,
            budget=req.budget,
            time_avail_h=req.time,
            top_n=req.top_n,
        )
        if not top_dests:
            raise HTTPException(status_code=404, detail="No destinations found for given preferences.")

        # Phase 3
        ordered = opt_svc.nearest_neighbour_tsp(top_dests)
        summary = opt_svc.build_route_summary(ordered, req.time)

        # Phase 4
        payload      = causal_svc.get_payload()
        explanations = explain_svc.explain(
            model        = payload["model"],
            feature_rows = [d["feature_row"] for d in top_dests],
            dest_names   = [d["name"]        for d in top_dests],
            features     = payload["features"],
        )

        return {
            "recommended_destinations": [
                {
                    "name":             d["name"],
                    "confidence":       d["confidence"],
                    "causal_cate":      d["causal_cate"],
                    "lat":              d.get("lat"),
                    "lng":              d.get("lng"),
                    "cost_lkr":         d.get("cost_lkr"),
                    "visit_duration_h": d.get("visit_duration_h"),
                    "category":         d.get("category"),
                }
                for d in top_dests
            ],
            "optimized_route": [
                {
                    "order":                   i + 1,
                    "name":                    s["name"],
                    "lat":                     s.get("lat"),
                    "lng":                     s.get("lng"),
                    "distance_from_prev_km":   s.get("distance_from_prev_km", 0.0),
                    "cost_lkr":                s.get("cost_lkr"),
                    "visit_duration_h":        s.get("visit_duration_h"),
                }
                for i, s in enumerate(ordered)
            ],
            "total_distance_km": summary["total_distance_km"],
            "total_cost_lkr":    summary["total_cost_lkr"],
            "estimated_time_h":  summary["estimated_time_h"],
            "explanations":      explanations,
            "model_name":        payload.get("best_model_name", "Ensemble"),
            "causal_method":     "Doubly Robust Estimation",
        }

    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        logger.error(f"Causal AI pipeline error: {exc}")
        raise HTTPException(status_code=500, detail=f"AI pipeline error: {str(exc)}")
