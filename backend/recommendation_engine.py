"""Core recommendation engine for Sri Lanka travel itineraries."""

from typing import Any, Optional

from sqlalchemy.orm import Session

from database.models import (
    BudgetRangeModel,
    Location,
    StartLocation,
    TravelCombination,
    TravelStyle,
)
from models import (
    BudgetRange,
    DayItinerary,
    EstimatedCost,
    LocationInfo,
    StartLocationInfo,
    TravelRecommendation,
)


class RecommendationEngine:
    """Engine for generating travel recommendations from the database."""

    def get_recommendations(
        self,
        db: Session,
        travel_styles: list[str],
        days: int,
        start_location: str,
        budget: int,
        limit: int = 10,
    ) -> list[TravelRecommendation]:
        """
        Get travel recommendations based on user preferences.

        Filtering (REQUIRED - must match exactly):
        - Start location must match exactly
        - Days must match exactly
        - Combo styles must be a SUBSET of user's selected styles (no extra styles allowed)
          Example: User selects [Adventure, Cultural]
          - Allowed: [Adventure, Cultural], [Adventure], [Cultural]
          - NOT allowed: [Adventure, Cultural, Spiritual]

        Scoring (for ranking matched results):
        - Style match: 70 points (PRIMARY - how well combo covers user's preferred styles)
        - Budget match: 30 points (under=30, within 20% over=15)
        """
        # Query combinations filtered by start_location and days
        combinations = (
            db.query(TravelCombination)
            .filter(
                TravelCombination.start_location == start_location,
                TravelCombination.days == days,
            )
            .all()
        )

        user_styles = set(travel_styles)
        scored_recommendations: list[tuple[float, float, TravelCombination]] = []

        for combo in combinations:
            combo_styles = set(s.name for s in combo.travel_styles)

            # Required: Combo styles must be a subset of user's selected styles
            if not combo_styles.issubset(user_styles):
                continue

            style_score = 0.0
            secondary_score = 0.0

            # PRIMARY: Style match - 70 points
            if user_styles:
                coverage = len(combo_styles & user_styles) / len(user_styles)
                style_score = coverage * 70

            # SECONDARY: Budget match - 30 points
            combo_budget = combo.budget
            if combo_budget <= budget:
                secondary_score += 30
            elif combo_budget <= budget * 1.2:
                secondary_score += 15

            total_score = style_score + secondary_score
            scored_recommendations.append((style_score, total_score, combo))

        # Sort by style_score first (primary), then by total_score (secondary)
        scored_recommendations.sort(key=lambda x: (x[0], x[1]), reverse=True)

        # Convert to TravelRecommendation models
        results: list[TravelRecommendation] = []
        for style_score, total_score, combo in scored_recommendations[:limit]:
            recommendation = self._convert_to_recommendation(combo, total_score)
            results.append(recommendation)

        return results

    def _convert_to_recommendation(
        self, combo: TravelCombination, score: float
    ) -> TravelRecommendation:
        """Convert a TravelCombination ORM object to a TravelRecommendation model."""
        # Convert itinerary from JSON
        itinerary: dict[str, DayItinerary] = {}
        raw_itinerary = combo.itinerary or {}
        for day_key, day_data in raw_itinerary.items():
            itinerary[day_key] = DayItinerary(
                locations=day_data.get("locations", []),
                description=day_data.get("description", ""),
                meals=day_data.get("meals", ""),
                accommodation=day_data.get("accommodation"),
                transport=day_data.get("transport", ""),
            )

        # Convert estimated cost from JSON
        raw_cost = combo.estimated_cost or {}
        estimated_cost = EstimatedCost(
            entrance_fees=raw_cost.get("entranceFees", 0),
            meals=raw_cost.get("meals", 0),
            transport=raw_cost.get("transport", 0),
            accommodation=raw_cost.get("accommodation"),
            guide=raw_cost.get("guide"),
            total=raw_cost.get("total", 0),
        )

        return TravelRecommendation(
            id=combo.id,
            travel_styles=[s.name for s in combo.travel_styles],
            days=combo.days,
            start_location=combo.start_location,
            budget=combo.budget,
            budget_category=combo.budget_category,
            itinerary=itinerary,
            estimated_cost=estimated_cost,
            highlights=combo.highlights or [],
            score=round(score, 2),
        )

    def get_all_locations(
        self, db: Session, category: Optional[str] = None
    ) -> list[LocationInfo]:
        """
        Get all locations, optionally filtered by category.

        Categories: cultural, spiritual, adventure, nature_wildlife
        """
        query = db.query(Location)

        if category:
            category_key = category.lower().replace("/", "_").replace("-", "_")
            query = query.filter(Location.category == category_key)

        locations = query.all()
        return [self._convert_to_location_info(loc) for loc in locations]

    def _convert_to_location_info(self, loc: Location) -> LocationInfo:
        """Convert a Location ORM object to a LocationInfo model."""
        return LocationInfo(
            id=loc.string_id,
            name=loc.name,
            district=loc.district,
            time_required=loc.time_required,
            entrance_fee=loc.entrance_fee,
            description=loc.description,
            coordinates=tuple(loc.coordinates) if loc.coordinates else None,
        )

    def get_combination_by_id(
        self, db: Session, combination_id: int
    ) -> Optional[TravelRecommendation]:
        """Get a specific travel combination by its ID."""
        combo = db.query(TravelCombination).filter(
            TravelCombination.id == combination_id
        ).first()

        if combo is None:
            return None

        return self._convert_to_recommendation(combo, 0)

    def get_travel_styles(self, db: Session) -> list[str]:
        """Get all available travel styles."""
        styles = db.query(TravelStyle).all()
        return [s.name for s in styles]

    def get_start_locations(self, db: Session) -> list[StartLocationInfo]:
        """Get all available start locations with coordinates."""
        locations = db.query(StartLocation).all()
        return [
            StartLocationInfo(
                id=loc.id,
                name=loc.name,
                coordinates=tuple(loc.coordinates) if loc.coordinates else None,
            )
            for loc in locations
        ]

    def get_budget_ranges(self, db: Session) -> dict[str, BudgetRange]:
        """Get all budget range categories."""
        ranges = db.query(BudgetRangeModel).all()
        result: dict[str, BudgetRange] = {}

        for r in ranges:
            result[r.key] = BudgetRange(
                min=r.min_value,
                max=r.max_value,
                label=r.label,
            )

        return result
