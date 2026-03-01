import pandas as pd
from database import SessionLocal
from database.models import Location
import ast
import traceback

def seed_ml_places():
    db = SessionLocal()
    try:
        # Clear all existing locations from previous nationwide seedings
        db.query(Location).delete()
        db.commit()
        
        # We start fresh with no existing db_names
        db_names = set()
        db_string_ids = set()
        
        # Build sets of existing locations from the DB
        existing_locs = db.query(Location.name, Location.string_id).all()
        for loc in existing_locs:
            db_names.add(loc.name.lower())
            db_string_ids.add(loc.string_id)
        
        # Read the new expanded Mihintale dataset
        df = pd.read_csv('data/mihintale_places_expanded.csv')
        
        added = 0
        for i, row in df.iterrows():
            name = str(row['name']).strip()
            string_id = name.lower().replace(' ', '_')[:50]
            
            # If not in DB name and not in string ID, add it
            if name.lower() not in db_names and string_id not in db_string_ids:
                lat = row.get('lat', 0.0)
                lng = row.get('lng', 0.0)
                
                # Determine category from extracted activities
                activities_str = row.get('extracted_activities', '[]')
                
                category = 'cultural'  # default fallback
                try:
                    if pd.isna(activities_str):
                        activities = []
                    else:
                        activities = ast.literal_eval(str(activities_str))
                    
                    if activities:
                        # Define some keyword mappings to categories
                        cat_mappings = {
                            'nature_wildlife': ['wildlife', 'animal', 'bird', 'nature', 'botanical', 'safari', 'national park', 'garden', 'elephant', 'turtle'],
                            'adventure': ['hiking', 'trekking', 'climbing', 'surfing', 'scuba', 'waterfall', 'camping', 'stargazing', 'adventure', 'boat', 'kayaking', 'paddle', 'fishing'],
                            'spiritual': ['temple', 'spiritual', 'meditation', 'yoga', 'church', 'mosque', 'kovil', 'ceremony', 'pilgrimage', 'shrine'],
                            'cultural': ['culture', 'historic', 'museum', 'art', 'architecture', 'monument', 'ruins', 'archaeological', 'fort', 'craft', 'tradition']
                        }
                        
                        # Find the first matching category
                        found_cat = None
                        for act in activities:
                            act_lower = act.lower()
                            for cat, keywords in cat_mappings.items():
                                if any(kw in act_lower for kw in keywords):
                                    found_cat = cat
                                    break
                            if found_cat:
                                break
                        
                        if found_cat:
                            category = found_cat
                except Exception as e:
                    print(f"Warning: Could not parse activities for {name}: {e}")
                
                # Make sure coordinates is stored as a list (JSON array) and not a string
                coords_list = [float(lat), float(lng)] if not pd.isna(lat) and not pd.isna(lng) else None

                loc = Location(
                    string_id=string_id,
                    name=name,
                    category=category,
                    district=str(row.get('formatted_address', 'Sri Lanka'))[:100],
                    time_required=2,
                    entrance_fee=1000,
                    description='Added from ML dataset',
                    coordinates=coords_list
                )
                db.add(loc)
                db_names.add(name.lower())
                db_string_ids.add(string_id)
                added += 1
                
        db.commit()
        print(f"Successfully added {added} new locations from the ML dataset to the database.")
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        print(f"Failed to seed ML places: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_ml_places()
