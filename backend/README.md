# Sri Lanka Travel Recommendation API

FastAPI backend that recommends travel itineraries in Sri Lanka based on user preferences.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/v1/recommendations` | Get travel recommendations |
| GET | `/api/v1/travel-styles` | List available travel styles |
| GET | `/api/v1/start-locations` | List starting locations |
| GET | `/api/v1/budget-ranges` | Get budget categories |
| GET | `/api/v1/locations` | List tourist locations (optional `?category=` filter) |
| GET | `/api/v1/combinations/{id}` | Get specific combination by ID |

## Example Request

```bash
curl -X POST http://localhost:8000/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{"travel_styles": ["Cultural"], "days": 1, "start_location": "Colombo Port", "budget": 50000}'
```

## Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
