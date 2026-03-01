import os
import pandas as pd
from typing import Dict, Any

from database.connection import engine
from database.models import Base, Location, StartLocation
from sqlalchemy.orm import Session

def seed_database():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Reading CSV dataset...")
    df = pd.read_csv("data/places_preprocessed.csv")
    
    with Session(engine) as session:
        # Check if locations exist
        existing = session.query(Location).count()
        if existing > 0:
            print(f"Database already has {existing} locations.")
        else:
            print("Populating Locations...")
            for idx, row in df.iterrows():
                loc = Location(
                    string_id=f"loc_{idx}",
                    name=row["name"],
                    category="Attraction",
                    district=str(row.get("formatted_address", "Sri Lanka")),
                    time_required=2,
                    entrance_fee=0,
                    description=f"A beautiful place: {row['name']}",
                    coordinates={"lat": float(row["lat"]), "lng": float(row["lng"])}
                )
                session.add(loc)
            session.commit()
            print("Finished populating locations.")

        # Seed StartLocations for recommendations.py mapping
        starts = [
            ("Galle Face Green", {"lat": 6.9234, "lng": 79.8427}),
            ("Galle Fort", {"lat": 6.0267, "lng": 80.2168}),
            ("Temple of the Sacred Tooth Relic", {"lat": 7.2936, "lng": 80.6415}),
            ("Anuradhapura New Town", {"lat": 8.3114, "lng": 80.4037})
        ]
        
        for name, coords in starts:
            if not session.query(StartLocation).filter_by(name=name).first():
                session.add(StartLocation(name=name, coordinates=coords))
        session.commit()
        print("Finished populating start locations.")

if __name__ == "__main__":
    seed_database()
