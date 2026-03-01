"""Database initialization script - creates all tables."""

from database.connection import create_tables, engine
from database.models import Base

if __name__ == "__main__":
    print("Creating database tables...")

    try:
        create_tables()
        print("Database tables created successfully!")
        print("\nTables created:")
        print("  - users")
        print("  - refresh_tokens")
        print("  - user_preferences")
        print("  - saved_itineraries")
        print("  - user_activity_log")
        print("  - travel_styles")
        print("  - start_locations")
        print("  - budget_ranges")
        print("  - locations")
        print("  - travel_combinations")
        print("  - combination_travel_styles")
    except Exception as e:
        print(f"Error creating tables: {e}")
        raise
