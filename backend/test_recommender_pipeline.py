import sys
import logging
from config import settings
from database import engine, SessionLocal
from services.ml_recommender import get_recommender
from services.itinerary_builder import build_itinerary
import traceback

logging.basicConfig(level=logging.INFO)

try:
    recommender = get_recommender()
    
    # Simulate API input
    user_activities = ["cultural", "adventure", "historic sites", "historical monuments"]
    user_bucket_list = ["Colombo Port"]
    
    print("--- RUNNING ML MODEL ---")
    best_route = recommender.recommend_top_places(user_activities, user_bucket_list)
    print(f"ML Model output best_route: {best_route}")
    
    print("--- RUNNING ITINERARY BUILDER ---")
    db = SessionLocal()
    itinerary = build_itinerary(db, list(best_route), 3, ["Cultural", "Adventure"], 150000, "Colombo Port")
    print("\n--- FINAL ITINERARY ---")
    import json
    print(json.dumps(itinerary, indent=2))
except Exception as e:
    traceback.print_exc()
