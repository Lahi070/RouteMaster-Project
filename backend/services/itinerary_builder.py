from typing import List, Dict, Any
from sqlalchemy.orm import Session
from database.models import Location
import ast
import json
import logging
import difflib

logger = logging.getLogger(__name__)

def build_itinerary(
    db: Session, 
    recommended_locations: List[str], 
    days: int, 
    travel_styles: List[str],
    budget: int,
    start_location: str,
    members: int = 1
) -> Dict[str, Any]:
    """
    Takes the ordered sequence of places from the ML model and chunks them 
    into a structured day-by-day itinerary matching the frontend JSON schema.
    """
    
    if not recommended_locations:
        return _empty_recommendation(travel_styles, days, start_location, budget)

    # Clean ML locations for exact search
    clean_locations = [loc.strip() for loc in recommended_locations]
    # Fetch locations
    locations = db.query(Location).filter(Location.name.in_(clean_locations)).all()
    
    # Create a lookup mapping location name -> Location ORM object
    loc_map = {loc.name: loc for loc in locations}
    
    valid_locations = []
    for name in clean_locations:
        if name in loc_map:
            valid_locations.append(loc_map[name])
        else:
            # Fallback matching: Extract all DB location names to compare
            db_names = list(loc_map.keys())
            
            # Substring match first
            matched = False
            for db_name in db_names:
                if name.lower() in db_name.lower() or db_name.lower() in name.lower():
                    valid_locations.append(loc_map[db_name])
                    matched = True
                    break
            
            # If no substring match, use fuzzy matching since the datasets use different naming conventions
            if not matched:
                matches = difflib.get_close_matches(name, db_names, n=1, cutoff=0.4)
                if matches:
                    valid_locations.append(loc_map[matches[0]])
                    
    # Deduplicate while preserving order
    seen = set()
    unique_valid_locations = []
    for loc in valid_locations:
        if loc.id not in seen:
            unique_valid_locations.append(loc)
            seen.add(loc.id)
            
    valid_locations = unique_valid_locations
    
    logger.info(f"Itinerary Builder valid_locations after DB filter: {[loc.name for loc in valid_locations]}")
    
    if not valid_locations:
        return _empty_recommendation(travel_styles, days, start_location, budget)

    # Chunk locations into days
    # Try to distribute as evenly as possible
    itinerary = {}
    
    locations_per_day = max(1, len(valid_locations) // days)
    remaining_locations = len(valid_locations)
    current_index = 0
    
    total_entrance_fees = 0
    highlights = set()

    for day_num in range(1, days + 1):
        day_key = f"day_{day_num}"
        
        # Calculate how many locations this day gets
        # If it's the last day, it gets all remaining
        if day_num == days:
            locations_for_this_day = valid_locations[current_index:]
        else:
            # allocate base amount, plus 1 if there's a remainder and we're early
            allocate = locations_per_day
            if (len(valid_locations) % days) >= day_num:
                allocate += 1
            
            locations_for_this_day = valid_locations[current_index:current_index + allocate]
            current_index += allocate
            
        day_locations_json = []
        for loc in locations_for_this_day:
            day_locations_json.append({
                "name": loc.name,
                "string_id": loc.string_id,
                "category": loc.category,
                "district": loc.district,
                "time_required": loc.time_required,
                "entrance_fee": loc.entrance_fee,
                "description": loc.description,
                "coordinates": loc.coordinates if loc.coordinates else [0.0, 0.0]
            })
            total_entrance_fees += loc.entrance_fee * members
            highlights.add(f"Visit {loc.name} in {loc.district}")
            
        # Versatile descriptive text based on travel styles, locations, and region
        districts = list(set(loc.district for loc in locations_for_this_day))
        loc_names = [loc.name for loc in locations_for_this_day]
        primary_style = travel_styles[0].lower() if travel_styles else "cultural"
        
        if len(locations_for_this_day) > 0:
            if primary_style == "nature/wildlife" or primary_style == "adventure":
                desc = f"Embrace the outdoors in {', '.join(districts)} today. Your journey features an exciting visit to {loc_names[0]}"
                if len(loc_names) > 1:
                    desc += f", followed by exploring {loc_names[1]}."
                else:
                    desc += "."
            elif primary_style == "spiritual":
                desc = f"Experience an atmosphere of serenity in {', '.join(districts)}. Today's peaceful reflections begin at {loc_names[0]}"
                if len(loc_names) > 1:
                    desc += f", and continue with mindful time at {loc_names[1]}."
                else:
                    desc += "."
            else:
                desc = f"Immerse yourself in the rich heritage of {', '.join(districts)}. Uncover the deep history starting at {loc_names[0]}"
                if len(loc_names) > 1:
                    desc += f", before transitioning to marvel at {loc_names[1]}."
                else:
                    desc += "."
        else:
            desc = "A relaxing day of leisure to recharge and enjoy the local surroundings at your own pace."
        
        # Budget-dependent meal and transport explanations
        meal_desc = f"Local cuisine recommendations for your group of {members}"
        transport_desc = "Tuk-tuk or trusted local transport"
        
        if budget >= 150000:
            meal_desc = "Premium dining experiences featuring curated local and international menus"
            transport_desc = "Private air-conditioned vehicle with a dedicated driver"
        elif budget >= 100000:
            meal_desc = "Mid-range restaurants and highly-rated local eateries"
            transport_desc = "Comfortable private car or pre-booked taxi services"

        itinerary[day_key] = {
            "locations": day_locations_json,
            "description": desc,
            "meals": meal_desc,
            "accommodation": f"Suggested stay in {districts[-1]} area" if districts and day_num != days else None,
            "transport": transport_desc
        }

    # Derive budget category and costs
    # Approximate costs adjusted for new max 200k budget
    daily_meal_cost = min(15000 * members, max(2000 * members, (budget * 0.15) / days))
    
    # Transport maxes out, but we assume a baseline covering the group up to a certain size
    daily_transport_cost = min(20000, max(2000, (budget * 0.20) / days))
    
    # Rooms factor around 2 people per room averagely
    rooms = max(1, (members + 1) // 2)
    daily_accommodation_cost = min(30000 * rooms, max(3000 * rooms, (budget * 0.35) / max(1, days-1)))

    total_meals = int(daily_meal_cost * days)
    total_transport = int(daily_transport_cost * days)
    total_accommodation = int(daily_accommodation_cost * max(1, days-1))
    
    total_cost = total_entrance_fees + total_meals + total_transport + total_accommodation

    # If the mathematical minimums outscale the max desired user budget,
    # ratio down the variable costs precisely.
    if total_cost > budget:
        remaining_budget = budget - total_entrance_fees
        if remaining_budget <= 0:
            total_meals = 0
            total_transport = 0
            total_accommodation = 0
        else:
            variable_sum = total_meals + total_transport + total_accommodation
            if variable_sum > 0:
                ratio = remaining_budget / variable_sum
                total_meals = int(total_meals * ratio)
                total_transport = int(total_transport * ratio)
                total_accommodation = int(total_accommodation * ratio)
                
        total_cost = total_entrance_fees + total_meals + total_transport + total_accommodation
        if total_cost > budget:
            total_cost = budget
    
    if budget < 50000:
        b_cat = "budget"
    elif budget < 100000:
        b_cat = "moderate"
    elif budget < 150000:
        b_cat = "luxury"
    else:
        b_cat = "premium"
    
    title_styles = " & ".join(travel_styles[:2])
    
    recommendation = {
        "title": f"{days}-Day {title_styles} Tour from {start_location}",
        "travel_styles": travel_styles,
        "days": days,
        "start_location": start_location,
        "budget": budget,
        "budget_category": b_cat,
        "itinerary": itinerary,
        "estimated_cost": {
            "entrance_fees": total_entrance_fees,
            "meals": total_meals,
            "transport": total_transport,
            "accommodation": total_accommodation,
            "total": total_cost
        },
        "highlights": list(highlights)[:5],
        "score": 85.0
    }
    
    return recommendation

def _empty_recommendation(travel_styles, days, start_location, budget, members=1):
    return {
        "title": "No Exact Matches Found",
        "travel_styles": travel_styles,
        "days": days,
        "start_location": start_location,
        "budget": budget,
        "budget_category": "unknown",
        "itinerary": {},
        "estimated_cost": {
            "entrance_fees": 0,
            "meals": 0,
            "transport": 0,
            "accommodation": 0,
            "total": 0
        },
        "highlights": [],
        "score": 0.0
    }
