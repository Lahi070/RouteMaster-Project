# Claude Code Prompt: Sri Lanka Travel Recommendation API

## Project Overview

Build a FastAPI backend for a Sri Lanka travel recommendation system. The system recommends travel itineraries based on user preferences including travel styles, duration, start location, and budget.

## Data Source

Use the existing JSON file: `data.json` (already in the backend folder)

This file contains:
- 50 pre-built travel combinations
- 39 Sri Lankan tourist locations with metadata
- 4 travel styles: Adventure, Cultural, Spiritual, Nature/Wildlife
- 4 start locations: Colombo Port, Galle Port, Kandy, Anuradhapura
- Budget ranges from Rs.25,000 to Rs.500,000

## Current Folder Structure

```
backend/
├── data.json          # ✅ Already exists - travel combinations data
└── PROMPT.md          # ✅ Already exists - this prompt file
```

## Required Folder Structure (Generate These)

```
backend/
├── data.json                    # ✅ Already exists - DO NOT modify
├── PROMPT.md                    # ✅ Already exists
├── main.py                      # FastAPI app entry point
├── config.py                    # Configuration settings
├── models.py                    # Pydantic models/schemas
├── recommendation_engine.py     # Core recommendation logic
├── requirements.txt             # Dependencies
└── README.md                    # Documentation
```

Keep it simple with flat structure - no nested folders needed.

## Requirements

### 1. Pydantic Models (models.py)

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from enum import Enum

class TravelStyle(str, Enum):
    ADVENTURE = "Adventure"
    CULTURAL = "Cultural"
    SPIRITUAL = "Spiritual"
    NATURE_WILDLIFE = "Nature/Wildlife"

class StartLocation(str, Enum):
    COLOMBO_PORT = "Colombo Port"
    GALLE_PORT = "Galle Port"
    KANDY = "Kandy"
    ANURADHAPURA = "Anuradhapura"

class TravelPreferenceRequest(BaseModel):
    travel_styles: List[TravelStyle]
    days: int = Field(..., ge=1, le=10, description="Number of days (1-10)")
    start_location: StartLocation
    budget: int = Field(..., ge=25000, description="Budget in LKR (min 25000)")

class DayItinerary(BaseModel):
    locations: List[str]
    description: str
    meals: str
    accommodation: Optional[str] = None
    transport: str

class EstimatedCost(BaseModel):
    entrance_fees: int = Field(alias="entranceFees")
    meals: int
    transport: int
    accommodation: Optional[int] = None
    total: int
    
    class Config:
        populate_by_name = True

class TravelRecommendation(BaseModel):
    id: int
    travel_styles: List[str] = Field(alias="travelStyles")
    days: int
    start_location: str = Field(alias="startLocation")
    budget: int
    budget_category: str = Field(alias="budgetCategory")
    itinerary: Dict[str, DayItinerary]
    estimated_cost: EstimatedCost = Field(alias="estimatedCost")
    highlights: List[str]
    match_score: float
    
    class Config:
        populate_by_name = True

class RecommendationResponse(BaseModel):
    success: bool
    total_results: int
    recommendations: List[TravelRecommendation]
    filters_applied: dict

class LocationInfo(BaseModel):
    id: str
    name: str
    district: str
    time_required: int = Field(alias="timeRequired")
    entrance_fee: int = Field(alias="entranceFee")
    description: str
    
    class Config:
        populate_by_name = True
```

### 2. Recommendation Engine (recommendation_engine.py)

```python
import json
from typing import List, Optional
from pathlib import Path

class RecommendationEngine:
    def __init__(self, data_path: str = "data.json"):
        self.data_path = Path(data_path)
        self.data = self._load_data()
    
    def _load_data(self) -> dict:
        with open(self.data_path, 'r') as f:
            return json.load(f)
    
    def get_recommendations(
        self,
        travel_styles: List[str],
        days: int,
        start_location: str,
        budget: int,
        limit: int = 10
    ) -> List[dict]:
        """
        Get travel recommendations based on user preferences.
        
        Matching criteria (priority order):
        1. Start location MUST match exactly (required filter)
        2. At least one travel style must overlap
        3. Days within ±1 day tolerance
        4. Budget within ±20% tolerance
        
        Scoring algorithm (100 points max):
        - Style match: 40 points (proportional to overlap)
        - Days match: 30 points (exact=30, ±1=15, else=0)
        - Budget match: 30 points (under=30, within 20% over=15, else=0)
        """
        combinations = self.data.get("travelCombinations", [])
        scored_results = []
        
        for combo in combinations:
            # Required: Start location must match
            if combo["startLocation"] != start_location:
                continue
            
            # Calculate match score
            score = self._calculate_match_score(combo, travel_styles, days, budget)
            
            # Only include if score > 0 (at least one style matches)
            if score > 0:
                combo_with_score = {**combo, "match_score": round(score, 1)}
                scored_results.append(combo_with_score)
        
        # Sort by score descending
        scored_results.sort(key=lambda x: x["match_score"], reverse=True)
        
        return scored_results[:limit]
    
    def _calculate_match_score(
        self,
        combo: dict,
        user_styles: List[str],
        user_days: int,
        user_budget: int
    ) -> float:
        score = 0.0
        
        # Style match (40 points)
        combo_styles = set(combo["travelStyles"])
        user_styles_set = set(user_styles)
        style_overlap = len(combo_styles & user_styles_set)
        
        if style_overlap == 0:
            return 0  # No style match = not relevant
        
        style_score = (style_overlap / len(user_styles_set)) * 40
        score += style_score
        
        # Days match (30 points)
        days_diff = abs(combo["days"] - user_days)
        if days_diff == 0:
            score += 30
        elif days_diff == 1:
            score += 15
        
        # Budget match (30 points)
        combo_budget = combo["budget"]
        if combo_budget <= user_budget:
            score += 30
        elif combo_budget <= user_budget * 1.2:  # Within 20% over
            score += 15
        
        return score
    
    def get_all_locations(self, category: Optional[str] = None) -> List[dict]:
        locations = self.data.get("locations", {})
        
        if category:
            return locations.get(category, [])
        
        # Return all locations flattened
        all_locations = []
        for cat, locs in locations.items():
            for loc in locs:
                loc_with_category = {**loc, "category": cat}
                all_locations.append(loc_with_category)
        return all_locations
    
    def get_combination_by_id(self, combo_id: int) -> Optional[dict]:
        combinations = self.data.get("travelCombinations", [])
        for combo in combinations:
            if combo["id"] == combo_id:
                return combo
        return None
    
    def get_travel_styles(self) -> List[str]:
        return self.data.get("travelStyles", [])
    
    def get_start_locations(self) -> List[str]:
        return self.data.get("startLocations", [])
    
    def get_budget_ranges(self) -> dict:
        return self.data.get("budgetRanges", {})
```

### 3. Main Application (main.py)

```python
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List

from models import (
    TravelPreferenceRequest,
    RecommendationResponse,
    TravelStyle,
    StartLocation
)
from recommendation_engine import RecommendationEngine
from config import settings

app = FastAPI(
    title="Sri Lanka Travel Recommendation API",
    description="Get personalized travel recommendations for Sri Lanka",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engine
engine = RecommendationEngine(data_path=settings.DATA_FILE_PATH)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "healthy", "message": "Sri Lanka Travel API is running"}


@app.post("/api/v1/recommendations", response_model=RecommendationResponse, tags=["Recommendations"])
def get_recommendations(preferences: TravelPreferenceRequest):
    """
    Get travel recommendations based on user preferences.
    
    - **travel_styles**: List of preferred travel styles (Adventure, Cultural, Spiritual, Nature/Wildlife)
    - **days**: Number of days for the trip (1-10)
    - **start_location**: Starting point (Colombo Port, Galle Port, Kandy, Anuradhapura)
    - **budget**: Budget in LKR (minimum 25,000)
    """
    styles = [style.value for style in preferences.travel_styles]
    
    recommendations = engine.get_recommendations(
        travel_styles=styles,
        days=preferences.days,
        start_location=preferences.start_location.value,
        budget=preferences.budget
    )
    
    return RecommendationResponse(
        success=True,
        total_results=len(recommendations),
        recommendations=recommendations,
        filters_applied={
            "travel_styles": styles,
            "days": preferences.days,
            "start_location": preferences.start_location.value,
            "budget": preferences.budget
        }
    )


@app.get("/api/v1/travel-styles", tags=["Reference Data"])
def get_travel_styles():
    """Get all available travel styles."""
    return {"travel_styles": engine.get_travel_styles()}


@app.get("/api/v1/start-locations", tags=["Reference Data"])
def get_start_locations():
    """Get all available start locations."""
    return {"start_locations": engine.get_start_locations()}


@app.get("/api/v1/budget-ranges", tags=["Reference Data"])
def get_budget_ranges():
    """Get budget range categories with min/max values."""
    return {"budget_ranges": engine.get_budget_ranges()}


@app.get("/api/v1/locations", tags=["Locations"])
def get_locations(
    category: Optional[str] = Query(
        None,
        description="Filter by category: cultural, spiritual, adventure, nature_wildlife"
    )
):
    """Get all tourist locations, optionally filtered by category."""
    locations = engine.get_all_locations(category=category)
    return {"total": len(locations), "locations": locations}


@app.get("/api/v1/combinations/{combo_id}", tags=["Combinations"])
def get_combination(combo_id: int):
    """Get a specific travel combination by ID."""
    combination = engine.get_combination_by_id(combo_id)
    if not combination:
        raise HTTPException(status_code=404, detail=f"Combination with ID {combo_id} not found")
    return combination
```

### 4. Configuration (config.py)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Sri Lanka Travel API"
    DATA_FILE_PATH: str = "data.json"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 5. Dependencies (requirements.txt)

```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
```

### 6. README (README.md)

```markdown
# Sri Lanka Travel Recommendation API

FastAPI backend for recommending travel itineraries in Sri Lanka.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/v1/recommendations` | Get recommendations |
| GET | `/api/v1/travel-styles` | List travel styles |
| GET | `/api/v1/start-locations` | List start locations |
| GET | `/api/v1/budget-ranges` | Get budget categories |
| GET | `/api/v1/locations` | List all locations |
| GET | `/api/v1/combinations/{id}` | Get specific combination |

## Example Request

```bash
curl -X POST http://localhost:8000/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "travel_styles": ["Cultural", "Spiritual"],
    "days": 3,
    "start_location": "Colombo Port",
    "budget": 100000
  }'
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
```

## Execution Commands

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000

# API will be available at:
# - http://localhost:8000
# - http://localhost:8000/docs (Swagger UI)
```

## Notes

- Keep flat file structure (no nested folders)
- DO NOT modify data.json - it already contains all travel combinations
- Use Python 3.10+ features
- Add type hints throughout
- Include docstrings for all functions
