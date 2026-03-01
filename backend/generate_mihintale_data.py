import urllib.request
import urllib.parse
import json
import pandas as pd
import random

# The provided list of locations and categories in the Mihintale area
locations = [
    "Anubuddhu Mihindu Mahaseya", "Aradhana Gala", "Ath Vehera",
    "Dana Sala", "Doramadalawa Temple", "Gal Palama",
    "Grirbandha Chetiya", "Iluppukanniya Wewa", "Indikatuseya",
    "Isenbessagala", "Kaludiya Pokuna", "Kantaka Chetiya",
    "Katu Seya", "Mahakanadara Wewa", "Mihindu Guhawa",
    "Mihindu Seya", "Mihintale Tablets", "Mihintale weva",
    "Mihinthalaya Rajamaha Viharaya", "Naga Pokuna", "Rajagirilena Rock",
    "Rajagirilena", "Sinha Pokuna", "Thapowanaya",
    "Timbiri Pokuna", "Vejja Sala", "Wasammale"
]

categories = [
    "cultural", "cultural", "adventure",
    "cultural", "cultural", "cultural",
    "cultural", "wildlife", "cultural",
    "cultural", "spiritual", "cultural",
    "cultural", "wildlife", "spiritual",
    "cultural", "cultural", "wildlife",
    "cultural", "spiritual", "adventure",
    "cultural", "cultural", "spiritual",
    "wildlife", "cultural", "cultural"
]

# We will generate a df mimicking the places_preprocessed.csv structure
# Required columns: name, lat, lng, formatted_address, rating, extracted_activities, activity_scores

# Simple mapping logic
category_to_activities = {
    "cultural": "['arts and culture', 'historic sites', 'cultural experiences', 'historical monuments']",
    "adventure": "['hiking', 'outdoor adventures', 'landscape photography']",
    "wildlife": "['wildlife viewing', 'bird watching', 'photography']",
    "spiritual": "['temple pilgrimages', 'spiritual retreats', 'meditation']"
}

category_to_scores = {
    "cultural": "[4.5, 4.0, 4.2, 4.5]",
    "adventure": "[4.0, 4.2, 4.8]",
    "wildlife": "[4.6, 4.3, 4.5]",
    "spiritual": "[5.0, 4.8, 4.5]"
}

# Base coordinates for Mihintale: 8.35, 80.5
base_lat = 8.35
base_lng = 80.5

df_data = []

for i, loc in enumerate(locations):
    cat = categories[i]
    
    # Generate some spread around Mihintale to make mapping interesting
    lat = base_lat + random.uniform(-0.02, 0.02)
    lng = base_lng + random.uniform(-0.02, 0.02)
    
    rating = round(random.uniform(3.8, 5.0), 1)
    
    activities = category_to_activities.get(cat, "['sightseeing']")
    scores = category_to_scores.get(cat, "[4.0]")
    
    df_data.append({
        "name": loc,
        "lat": lat,
        "lng": lng,
        "formatted_address": "Mihintale, Anuradhapura District, Sri Lanka",
        "rating": rating,
        "extracted_activities": activities,
        "activity_scores": scores
    })

df = pd.DataFrame(df_data)
df.to_csv("data/mihintale_places.csv", index=False)
print("Saved custom Mihintale dataset to data/mihintale_places.csv:")
print(df.head())
