# Sri Lanka Travel Recommendation API Documentation

**Base URL:** `http://localhost:8000`
**Content-Type:** `application/json`

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/v1/recommendations` | Get travel recommendations |
| GET | `/api/v1/travel-styles` | List available travel styles |
| GET | `/api/v1/start-locations` | List starting locations |
| GET | `/api/v1/budget-ranges` | Get budget categories |
| GET | `/api/v1/locations` | List tourist locations |
| GET | `/api/v1/combinations/{id}` | Get specific combination |

---

## 1. Health Check

Check if the API is running.

**Endpoint:** `GET /`

### Request
```
No request body required
```

### Response
```json
{
  "status": "healthy",
  "service": "Sri Lanka Travel Recommendation API"
}
```

---

## 2. Get Travel Recommendations

Get personalized travel recommendations based on user preferences.

**Endpoint:** `POST /api/v1/recommendations`

### Request Body
```json
{
  "travel_styles": ["Cultural", "Adventure"],
  "days": 3,
  "start_location": "Colombo Port",
  "budget": 150000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `travel_styles` | `string[]` | Yes | List of preferred travel styles. Options: `Adventure`, `Cultural`, `Spiritual`, `Nature/Wildlife` |
| `days` | `integer` | Yes | Number of travel days (1-14) |
| `start_location` | `string` | Yes | Starting point. Options: `Colombo Port`, `Galle Port`, `Kandy`, `Anuradhapura` |
| `budget` | `integer` | Yes | Maximum budget in LKR (Sri Lankan Rupees) |

### Response
```json
{
  "success": true,
  "totalResults": 2,
  "recommendations": [
    {
      "id": 13,
      "travelStyles": ["Cultural", "Adventure"],
      "days": 3,
      "startLocation": "Colombo Port",
      "budget": 150000,
      "budgetCategory": "Comfort",
      "itinerary": {
        "day1": {
          "locations": ["Sigiriya Rock Fortress", "Dambulla Cave Temple"],
          "description": "Cultural triangle highlights",
          "meals": "Hotel restaurant",
          "accommodation": "4-star hotel in Sigiriya",
          "transport": "Private car with A/C"
        },
        "day2": {
          "locations": ["Knuckles Mountain Range"],
          "description": "Trekking in mountain wilderness",
          "meals": "Packed lunch",
          "accommodation": "Eco lodge in Knuckles",
          "transport": "4x4 vehicle"
        },
        "day3": {
          "locations": ["Kandy Temple of the Tooth", "Peradeniya Botanical Gardens"],
          "description": "Kandy cultural experience",
          "meals": "Fine dining",
          "accommodation": null,
          "transport": "Private car"
        }
      },
      "estimatedCost": {
        "entranceFees": 12530,
        "meals": 18000,
        "transport": 35000,
        "accommodation": 35000,
        "guide": null,
        "total": 100530
      },
      "highlights": ["Ancient rock fortress", "Mountain trekking", "Royal heritage"],
      "score": 100.0
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Request success status |
| `totalResults` | `integer` | Number of recommendations returned |
| `recommendations` | `array` | List of travel recommendations |

#### Recommendation Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | `integer` | Unique identifier |
| `travelStyles` | `string[]` | Travel styles covered |
| `days` | `integer` | Duration in days |
| `startLocation` | `string` | Starting location |
| `budget` | `integer` | Budget category upper limit (LKR) |
| `budgetCategory` | `string` | Budget tier: `Budget`, `Moderate`, `Comfort`, `Luxury` |
| `itinerary` | `object` | Day-by-day itinerary (keys: `day1`, `day2`, etc.) |
| `estimatedCost` | `object` | Cost breakdown |
| `highlights` | `string[]` | Trip highlights |
| `score` | `float` | Matching score (0-100) |

#### Day Itinerary Object

| Field | Type | Description |
|-------|------|-------------|
| `locations` | `string[]` | Places to visit |
| `description` | `string` | Day overview |
| `meals` | `string` | Meal arrangements |
| `accommodation` | `string\|null` | Accommodation (null for day trips or last day) |
| `transport` | `string` | Transportation method |

#### Estimated Cost Object

| Field | Type | Description |
|-------|------|-------------|
| `entranceFees` | `integer` | Total entrance fees (LKR) |
| `meals` | `integer` | Meal costs (LKR) |
| `transport` | `integer` | Transport costs (LKR) |
| `accommodation` | `integer\|null` | Accommodation costs (LKR) |
| `guide` | `integer\|null` | Guide fees if applicable (LKR) |
| `total` | `integer` | Total estimated cost (LKR) |

### Filtering & Scoring Algorithm

#### Filtering Rules (REQUIRED - must match exactly)
1. **Start Location**: Must match exactly
2. **Days**: Must match exactly
3. **Travel Styles**: Combo styles must be a **subset** of user's selected styles (no extra styles allowed)

**Style Filter Example:**
```
User selects: ["Adventure", "Cultural"]

✅ Allowed combos:
   - ["Adventure", "Cultural"]  (exact match)
   - ["Adventure"]              (subset)
   - ["Cultural"]               (subset)

❌ Excluded combos:
   - ["Adventure", "Cultural", "Spiritual"]  (has extra style)
   - ["Adventure", "Nature/Wildlife"]        (has extra style)
```

#### Scoring (100 points total)
After filtering, results are ranked by score. Travel styles are the **PRIMARY** focus.

| Factor | Points | Priority | Details |
|--------|--------|----------|---------|
| **Style Match** | 70 pts | PRIMARY | % of user's preferred styles covered by combo |
| **Budget Match** | 30 pts | Secondary | Under budget = 30, within 20% over = 15 |

**Style Score Calculation:**
```
style_score = (combo_styles ∩ user_styles) / user_styles × 70
```
Example: User requests ["Cultural", "Adventure"], combo has ["Cultural"] → score = (1/2) × 70 = 35 points

---

## 3. Get Travel Styles

Get all available travel styles.

**Endpoint:** `GET /api/v1/travel-styles`

### Request
```
No request body required
```

### Response
```json
["Adventure", "Cultural", "Spiritual", "Nature/Wildlife"]
```

---

## 4. Get Start Locations

Get all available starting locations.

**Endpoint:** `GET /api/v1/start-locations`

### Request
```
No request body required
```

### Response
```json
["Colombo Port", "Galle Port", "Kandy", "Anuradhapura"]
```

---

## 5. Get Budget Ranges

Get budget categories with min/max values.

**Endpoint:** `GET /api/v1/budget-ranges`

### Request
```
No request body required
```

### Response
```json
{
  "budget": {
    "min": 25000,
    "max": 50000,
    "label": "Budget"
  },
  "moderate": {
    "min": 50001,
    "max": 100000,
    "label": "Moderate"
  },
  "comfort": {
    "min": 100001,
    "max": 200000,
    "label": "Comfort"
  },
  "luxury": {
    "min": 200001,
    "max": 500000,
    "label": "Luxury"
  }
}
```

### Budget Range Object

| Field | Type | Description |
|-------|------|-------------|
| `min` | `integer` | Minimum budget (LKR) |
| `max` | `integer` | Maximum budget (LKR) |
| `label` | `string` | Display label |

---

## 6. Get Locations

Get all tourist locations, optionally filtered by category.

**Endpoint:** `GET /api/v1/locations`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | `string` | No | Filter by category: `cultural`, `spiritual`, `adventure`, `nature_wildlife` |

### Request Examples
```
GET /api/v1/locations
GET /api/v1/locations?category=cultural
GET /api/v1/locations?category=adventure
```

### Response
```json
[
  {
    "id": "sigiriya",
    "name": "Sigiriya Rock Fortress",
    "district": "Matale",
    "timeRequired": 4,
    "entranceFee": 5580,
    "description": "Ancient rock fortress with frescoes"
  },
  {
    "id": "polonnaruwa",
    "name": "Polonnaruwa Ancient City",
    "district": "Polonnaruwa",
    "timeRequired": 4,
    "entranceFee": 3850,
    "description": "Medieval capital ruins"
  }
]
```

### Location Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `name` | `string` | Location name |
| `district` | `string` | District in Sri Lanka |
| `timeRequired` | `integer` | Recommended visit duration (hours) |
| `entranceFee` | `integer` | Entrance fee (LKR), 0 if free |
| `description` | `string` | Brief description |

---

## 7. Get Combination by ID

Get a specific travel combination by its ID.

**Endpoint:** `GET /api/v1/combinations/{id}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `integer` | Yes | Combination ID (1-50) |

### Request Example
```
GET /api/v1/combinations/5
```

### Response
```json
{
  "id": 5,
  "travelStyles": ["Cultural"],
  "days": 1,
  "startLocation": "Anuradhapura",
  "budget": 40000,
  "budgetCategory": "Budget",
  "itinerary": {
    "day1": {
      "locations": ["Anuradhapura Sacred City", "Sri Maha Bodhi", "Ruwanwelisaya Stupa"],
      "description": "Ancient capital exploration",
      "meals": "Local restaurants",
      "accommodation": null,
      "transport": "Bicycle/Tuk-tuk"
    }
  },
  "estimatedCost": {
    "entranceFees": 3850,
    "meals": 2500,
    "transport": 3000,
    "accommodation": null,
    "guide": null,
    "total": 9350
  },
  "highlights": ["Ancient ruins", "Sacred Bo tree", "Buddhist stupas"],
  "score": 0.0
}
```

### Error Response (404)
```json
{
  "detail": "Combination with ID 999 not found"
}
```

---

## Error Responses

### Validation Error (422)
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "travel_styles"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

### Not Found (404)
```json
{
  "detail": "Combination with ID {id} not found"
}
```

### Internal Server Error (500)
```json
{
  "detail": "Internal server error"
}
```

---

## Interactive Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Example cURL Commands

### Get Recommendations
```bash
curl -X POST http://localhost:8000/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "travel_styles": ["Cultural", "Adventure"],
    "days": 3,
    "start_location": "Colombo Port",
    "budget": 150000
  }'
```

### Get All Locations
```bash
curl http://localhost:8000/api/v1/locations
```

### Get Cultural Locations
```bash
curl "http://localhost:8000/api/v1/locations?category=cultural"
```

### Get Combination by ID
```bash
curl http://localhost:8000/api/v1/combinations/13
```
