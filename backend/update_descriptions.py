import os
import wikipedia
from sqlalchemy.orm import Session
from database import SessionLocal
from database.models import Location
import time

def get_wiki_summary(place_name: str, category: str) -> str:
    """Tries to get a 1-2 sentence summary from Wikipedia."""
    try:
        # Prevent rate limits
        time.sleep(1)
        
        # Search for the place first to handle slight name variations (e.g. adding 'Sri Lanka' helps disambiguate)
        search_query = f"{place_name} Sri Lanka"
        results = wikipedia.search(search_query, results=1)
        
        if results:
            # Get the first 2 sentences of the summary
            summary = wikipedia.summary(results[0], sentences=2, auto_suggest=False)
            # Make sure the summary is somewhat relevant (contains the country or name)
            if "Sri Lanka" in summary or place_name.split()[0] in summary:
                return summary

    except wikipedia.exceptions.DisambiguationError as e:
        # If it's ambiguous, try the first option
        try:
            summary = wikipedia.summary(e.options[0], sentences=2, auto_suggest=False)
            if "Sri Lanka" in summary or place_name.split()[0] in summary:
                return summary
        except Exception:
            pass
    except Exception as e:
        print(f"Failed to fetch wikipedia for {place_name}: {e}")

    # Fallback descriptions if wikipedia fails
    if category == 'nature_wildlife':
        return f"A beautiful natural attraction in Sri Lanka, perfect for wildlife enthusiasts and nature lovers."
    elif category == 'adventure':
        return f"An exciting destination in Sri Lanka offering thrilling outdoor activities and scenic views."
    elif category == 'spiritual':
        return f"A serene and sacred spiritual site located in Sri Lanka, offering a peaceful atmosphere."
    else:  # cultural
        return f"A notable cultural and historical landmark in Sri Lanka."

def update_descriptions():
    db: Session = SessionLocal()
    try:
        # Find all locations with the ML dummy text
        locations = db.query(Location).filter(Location.description == 'Added from ML dataset').all()
        print(f"Found {len(locations)} locations to update.")
        
        updated = 0
        for loc in locations:
            print(f"Fetching description for: {loc.name}")
            new_desc = get_wiki_summary(loc.name, loc.category)
            
            # Additional cleanup of the summary string if needed (truncate if excessively long)
            if len(new_desc) > 300:
                new_desc = new_desc[:297] + "..."
                
            loc.description = new_desc
            safe_desc = new_desc.encode('ascii', 'ignore').decode('ascii')
            print(f"  -> {safe_desc}")
            updated += 1
            
            # Commit every 10 to save progress
            if updated % 10 == 0:
                db.commit()
                
        # Final commit
        db.commit()
        print(f"Successfully updated {updated} descriptions.")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_descriptions()
