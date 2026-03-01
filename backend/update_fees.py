import random
from sqlalchemy.orm import Session
from database import SessionLocal
from database.models import Location

def update_entrance_fees():
    db: Session = SessionLocal()
    try:
        # Fetch all locations with precisely 1000 entrance fee
        locations = db.query(Location).filter(Location.entrance_fee == 1000).all()
        print(f"Found {len(locations)} locations with an entrance fee of 1000 LKR to randomize.")
        
        updated = 0
        for loc in locations:
            # Randomize the fee based on category
            if loc.category == 'spiritual':
                # Spiritual places are often free or cheap
                new_fee = random.choice([0, 0, 500, 1000])
            elif loc.category == 'nature_wildlife':
                # Safari parks cost more
                new_fee = random.choice([2000, 3000, 4000, 5000, 5500])
            elif loc.category == 'adventure':
                # Adventure places vary
                new_fee = random.choice([0, 1500, 2500, 4000])
            else:
                # Cultural 
                new_fee = random.choice([0, 500, 1500, 2500, 3500])
                
            loc.entrance_fee = new_fee
            updated += 1
            print(f"Updated {loc.name} entrance fee to LKR {new_fee}")
            
        db.commit()
        print(f"Successfully randomized {updated} location entrance fees.")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_entrance_fees()
