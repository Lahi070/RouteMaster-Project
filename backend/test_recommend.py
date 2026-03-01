from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

response = client.post(
    "/api/v1/recommendations",
    json={
        "travel_styles": ["Cultural"],
        "days": 3,
        "start_location": "Colombo Port",
        "budget": 50000
    }
)

print("-" * 50)
print("STATUS:", response.status_code)
print("RESPONSE:")
print(json.dumps(response.json(), indent=2))
print("-" * 50)
