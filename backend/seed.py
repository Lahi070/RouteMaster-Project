"""Seed script to populate the database from data.json."""

import json
from pathlib import Path

from config import settings
from database.connection import SessionLocal, create_tables
from database.models import (
    BudgetRangeModel,
    Location,
    StartLocation,
    TravelCombination,
    TravelStyle,
    combination_travel_styles,
)


def seed_database() -> None:
    """Read data.json and populate all travel data tables."""
    # Load data.json
    data_path = Path(settings.DATA_FILE_PATH)
    if not data_path.exists():
        raise FileNotFoundError(f"Data file not found: {data_path}")

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Create tables if they don't exist
    create_tables()

    db = SessionLocal()
    try:
        # Clear existing travel data (idempotent - doesn't touch user tables)
        db.execute(combination_travel_styles.delete())
        db.query(TravelCombination).delete()
        db.query(Location).delete()
        db.query(BudgetRangeModel).delete()
        db.query(StartLocation).delete()
        db.query(TravelStyle).delete()
        db.flush()

        # 1. Seed travel styles
        style_map: dict[str, TravelStyle] = {}
        for name in data.get("travelStyles", []):
            style = TravelStyle(name=name)
            db.add(style)
            style_map[name] = style
        db.flush()
        print(f"  Seeded {len(style_map)} travel styles")

        # 2. Seed start locations
        start_coords = data.get("startLocationCoordinates", {})
        for name in data.get("startLocations", []):
            db.add(StartLocation(name=name, coordinates=start_coords.get(name)))
        db.flush()
        print(f"  Seeded {len(data.get('startLocations', []))} start locations")

        # 3. Seed budget ranges
        for key, value in data.get("budgetRanges", {}).items():
            db.add(BudgetRangeModel(
                key=key,
                min_value=value["min"],
                max_value=value["max"],
                label=value["label"],
            ))
        db.flush()
        print(f"  Seeded {len(data.get('budgetRanges', {}))} budget ranges")

        # 4. Seed locations
        location_count = 0
        for category, locations in data.get("locations", {}).items():
            for loc in locations:
                db.add(Location(
                    string_id=loc["id"],
                    name=loc["name"],
                    category=category,
                    district=loc["district"],
                    time_required=loc["timeRequired"],
                    entrance_fee=loc["entranceFee"],
                    description=loc["description"],
                    coordinates=loc.get("coordinates"),
                ))
                location_count += 1
        db.flush()
        print(f"  Seeded {location_count} locations")

        # 5. Seed travel combinations
        combinations = data.get("travelCombinations", [])
        for combo in combinations:
            tc = TravelCombination(
                id=combo["id"],
                days=combo["days"],
                start_location=combo["startLocation"],
                budget=combo["budget"],
                budget_category=combo["budgetCategory"],
                itinerary=combo["itinerary"],
                estimated_cost=combo["estimatedCost"],
                highlights=combo["highlights"],
            )
            # Link travel styles
            for style_name in combo.get("travelStyles", []):
                if style_name in style_map:
                    tc.travel_styles.append(style_map[style_name])
            db.add(tc)
        db.flush()
        print(f"  Seeded {len(combinations)} travel combinations")

        db.commit()
        print("\nDatabase seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database from data.json...")
    seed_database()
