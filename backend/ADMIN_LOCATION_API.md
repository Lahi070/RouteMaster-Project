# Admin Location Management API Documentation

## Overview

This document describes the admin-only API endpoints for managing location data in the RouteMaster travel recommendation system.

## Authentication

All admin endpoints require:

1. Valid JWT access token in the Authorization header
2. User account with `role = "admin"`

### Authorization Header

```
Authorization: Bearer <your_access_token>
```

## Base URL

```
/admin/locations
```

---

## Endpoints

### 1. Get All Locations (with filtering)

Get a paginated list of all locations with optional filtering.

**Endpoint:** `GET /admin/locations`

**Query Parameters:**

- `skip` (integer, optional): Number of records to skip for pagination. Default: 0
- `limit` (integer, optional): Maximum number of records to return (1-500). Default: 100
- `category` (string, optional): Filter by location category
- `district` (string, optional): Filter by district name
- `search` (string, optional): Search in name, description, or string_id

**Response:** `200 OK`

```json
{
  "total": 45,
  "locations": [
    {
      "id": 1,
      "stringId": "temple-tooth-relic",
      "name": "Temple of the Tooth Relic",
      "category": "Temple",
      "district": "Kandy",
      "timeRequired": 2,
      "entranceFee": 1500,
      "description": "Sacred Buddhist temple housing the relic of the tooth of Buddha",
      "coordinates": {
        "lat": 7.2934,
        "lng": 80.6411
      }
    }
  ]
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/admin/locations?skip=0&limit=20&category=Temple" \
  -H "Authorization: Bearer your_token_here"
```

---

### 2. Get Location by ID

Retrieve details of a specific location.

**Endpoint:** `GET /admin/locations/{location_id}`

**Path Parameters:**

- `location_id` (integer, required): The ID of the location

**Response:** `200 OK`

```json
{
  "id": 1,
  "stringId": "temple-tooth-relic",
  "name": "Temple of the Tooth Relic",
  "category": "Temple",
  "district": "Kandy",
  "timeRequired": 2,
  "entranceFee": 1500,
  "description": "Sacred Buddhist temple housing the relic of the tooth of Buddha",
  "coordinates": {
    "lat": 7.2934,
    "lng": 80.6411
  }
}
```

**Error Response:** `404 Not Found`

```json
{
  "detail": "Location with ID 999 not found"
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/admin/locations/1" \
  -H "Authorization: Bearer your_token_here"
```

---

### 3. Create New Location

Add a new location to the database.

**Endpoint:** `POST /admin/locations`

**Request Body:**

```json
{
  "stringId": "sigiriya-rock",
  "name": "Sigiriya Rock Fortress",
  "category": "Historical Site",
  "district": "Matale",
  "timeRequired": 3,
  "entranceFee": 5000,
  "description": "Ancient rock fortress and palace ruins with stunning frescoes",
  "coordinates": {
    "lat": 7.957,
    "lng": 80.7603
  }
}
```

**Field Descriptions:**

- `stringId` (string, required): Unique identifier (must be unique across all locations)
- `name` (string, required): Location name (1-255 characters)
- `category` (string, required): Category type (1-50 characters)
- `district` (string, required): District name (1-100 characters)
- `timeRequired` (integer, required): Time required in hours (>= 0)
- `entranceFee` (integer, required): Entrance fee in LKR (>= 0)
- `description` (string, required): Detailed description
- `coordinates` (object, optional): Latitude and longitude

**Response:** `201 Created`

```json
{
  "id": 46,
  "stringId": "sigiriya-rock",
  "name": "Sigiriya Rock Fortress",
  "category": "Historical Site",
  "district": "Matale",
  "timeRequired": 3,
  "entranceFee": 5000,
  "description": "Ancient rock fortress and palace ruins with stunning frescoes",
  "coordinates": {
    "lat": 7.957,
    "lng": 80.7603
  }
}
```

**Error Response:** `409 Conflict`

```json
{
  "detail": "Location with string_id 'sigiriya-rock' already exists"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/admin/locations" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "stringId": "sigiriya-rock",
    "name": "Sigiriya Rock Fortress",
    "category": "Historical Site",
    "district": "Matale",
    "timeRequired": 3,
    "entranceFee": 5000,
    "description": "Ancient rock fortress and palace ruins with stunning frescoes"
  }'
```

---

### 4. Update Location

Update an existing location. All fields are optional - only provided fields will be updated.

**Endpoint:** `PATCH /admin/locations/{location_id}`

**Path Parameters:**

- `location_id` (integer, required): The ID of the location to update

**Request Body (all fields optional):**

```json
{
  "name": "Updated Location Name",
  "entranceFee": 2000,
  "description": "Updated description"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "stringId": "temple-tooth-relic",
  "name": "Updated Location Name",
  "category": "Temple",
  "district": "Kandy",
  "timeRequired": 2,
  "entranceFee": 2000,
  "description": "Updated description",
  "coordinates": {
    "lat": 7.2934,
    "lng": 80.6411
  }
}
```

**Error Responses:**

- `404 Not Found`: Location not found
- `409 Conflict`: String ID conflict if updating stringId to an existing value

**Example Request:**

```bash
curl -X PATCH "http://localhost:8000/admin/locations/1" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "entranceFee": 2000,
    "description": "Updated description with new entrance fee"
  }'
```

---

### 5. Delete Location

Delete a location from the database.

**Endpoint:** `DELETE /admin/locations/{location_id}`

**Path Parameters:**

- `location_id` (integer, required): The ID of the location to delete

**Response:** `200 OK`

```json
{
  "message": "Location 1 deleted successfully"
}
```

**Error Response:** `404 Not Found`

```json
{
  "detail": "Location with ID 999 not found"
}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/admin/locations/1" \
  -H "Authorization: Bearer your_token_here"
```

---

### 6. Get All Categories

Get a list of all unique location categories.

**Endpoint:** `GET /admin/locations/categories`

**Response:** `200 OK`

```json
["Beach", "Historical Site", "National Park", "Temple", "Wildlife Sanctuary"]
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/admin/locations/categories" \
  -H "Authorization: Bearer your_token_here"
```

---

### 7. Get All Districts

Get a list of all unique districts.

**Endpoint:** `GET /admin/locations/districts`

**Response:** `200 OK`

```json
["Ampara", "Colombo", "Galle", "Kandy", "Matale"]
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/admin/locations/districts" \
  -H "Authorization: Bearer your_token_here"
```

---

## Error Handling

### Authentication Errors

**Response:** `401 Unauthorized`

```json
{
  "detail": "Could not validate credentials"
}
```

### Authorization Errors

**Response:** `403 Forbidden`

```json
{
  "detail": "Admin access required"
}
```

### Validation Errors

**Response:** `422 Unprocessable Entity`

```json
{
  "detail": [
    {
      "loc": ["body", "entranceFee"],
      "msg": "ensure this value is greater than or equal to 0",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

---

## Testing with Swagger UI

The API includes interactive documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

To test admin endpoints:

1. First login or register to get an access token
2. Click the "Authorize" button in Swagger UI
3. Enter: `Bearer <your_access_token>`
4. Try the admin endpoints

---

## Example Workflow

### 1. Login as Admin

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@routemaster.com",
    "password": "your_password"
  }'
```

Save the `accessToken` from the response.

### 2. List All Locations

```bash
curl -X GET "http://localhost:8000/admin/locations?limit=10" \
  -H "Authorization: Bearer <accessToken>"
```

### 3. Create a New Location

```bash
curl -X POST "http://localhost:8000/admin/locations" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "stringId": "galle-fort",
    "name": "Galle Fort",
    "category": "Historical Site",
    "district": "Galle",
    "timeRequired": 2,
    "entranceFee": 0,
    "description": "Historic fortification built by Portuguese and later expanded by Dutch",
    "coordinates": {"lat": 6.0270, "lng": 80.2168}
  }'
```

### 4. Update the Location

```bash
curl -X PATCH "http://localhost:8000/admin/locations/46" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "UNESCO World Heritage Site - Historic fortification"
  }'
```

### 5. Delete the Location

```bash
curl -X DELETE "http://localhost:8000/admin/locations/46" \
  -H "Authorization: Bearer <accessToken>"
```

---

## Notes

1. **Admin Role Required**: All these endpoints require the user to have `role = "admin"` in the database.
2. **String ID Uniqueness**: The `stringId` field must be unique across all locations.
3. **Cascading Effects**: Be careful when deleting locations that might be referenced in travel combinations or itineraries.
4. **Pagination**: Use `skip` and `limit` parameters for large datasets.
5. **Search**: The search parameter performs case-insensitive matching across name, description, and stringId fields.
