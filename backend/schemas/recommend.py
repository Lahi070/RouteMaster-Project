"""Pydantic schemas for the causal AI recommendation endpoint."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class RecommendConstraints(BaseModel):
    region: str = "Mihintale"
    max_distance: Optional[float] = None


class CausalRecommendRequest(BaseModel):
    age: int = Field(..., ge=5, le=100)
    gender: str = Field(..., description="Male or Female")
    preferences: List[str] = Field(..., min_length=1)
    budget: float = Field(..., gt=0, description="Budget in LKR")
    time: float = Field(..., gt=0, description="Available time in hours")
    top_n: int = Field(default=5, ge=1, le=20)
    constraints: RecommendConstraints = Field(default_factory=RecommendConstraints)

    @field_validator("gender")
    @classmethod
    def normalise_gender(cls, v: str) -> str:
        return v.strip().capitalize()

    @field_validator("preferences")
    @classmethod
    def normalise_prefs(cls, v: List[str]) -> List[str]:
        return [p.strip().lower() for p in v]


class SHAPFeature(BaseModel):
    feature: str
    shap_value: float


class DestinationExplanation(BaseModel):
    top_features: List[SHAPFeature]
    explanation_text: str
    confidence: float


class AIDestination(BaseModel):
    name: str
    confidence: float = Field(description="Model confidence 0-1")
    causal_cate: float = Field(description="Causally-adjusted score")
    lat: Optional[float] = None
    lng: Optional[float] = None
    cost_lkr: Optional[float] = None
    visit_duration_h: Optional[float] = None
    category: Optional[str] = None


class OptimizedStop(BaseModel):
    order: int
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    distance_from_prev_km: float = 0.0
    cost_lkr: Optional[float] = None
    visit_duration_h: Optional[float] = None


class CausalRecommendResponse(BaseModel):
    recommended_destinations: List[AIDestination]
    optimized_route: List[OptimizedStop]
    total_distance_km: float
    total_cost_lkr: float
    estimated_time_h: float
    explanations: Dict[str, DestinationExplanation]
    model_name: str
    causal_method: str = "Doubly Robust Estimation"
