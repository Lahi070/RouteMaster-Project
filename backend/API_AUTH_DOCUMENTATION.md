# RouteMaster API - Complete Documentation

## 🚀 Authentication System Implemented

Your FastAPI backend now has a complete JWT-based authentication system with access and refresh tokens!

## 📁 Project Structure

```
backend/
├── main.py                          # FastAPI app with all routes
├── config.py                        # Configuration settings
├── init_db.py                       # Database initialization script
├── requirements.txt                 # Dependencies
├── .env                            # Environment variables
│
├── core/                           # Core utilities
│   ├── security.py                 # JWT & password hashing
│   └── exceptions.py               # Custom exceptions
│
├── database/                       # Database layer
│   ├── models.py                   # SQLAlchemy ORM models
│   └── connection.py               # Database connection
│
├── schemas/                        # Pydantic models (request/response)
│   ├── auth.py                     # Auth schemas
│   ├── user.py                     # User schemas
│   └── common.py                   # Common schemas
│
├── services/                       # Business logic
│   ├── auth_service.py             # Authentication logic
│   ├── user_service.py             # User operations
│   └── token_service.py            # Token management
│
└── api/                            # API routes
    ├── deps.py                     # Dependencies (get_current_user)
    └── routes/
        ├── auth.py                 # Auth endpoints
        ├── users.py                # User endpoints
        └── recommendations.py      # Travel recommendations
```

---

## 🔐 Authentication Endpoints

### Base URL: `http://localhost:8000`

### 1. Register New User

**POST** `/auth/register`

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "secure123",
    "fullName": "John Doe"
  }'
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "role": "user",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2026-02-06T12:00:00",
    "lastLogin": null
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "bearer"
  }
}
```

---

### 2. Login

**POST** `/auth/login`

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123"
  }'
```

**Response:** Same as register

---

### 3. Refresh Access Token

**POST** `/auth/refresh`

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:**

```json
{
  "accessToken": "new_access_token...",
  "refreshToken": "same_refresh_token...",
  "tokenType": "bearer"
}
```

---

### 4. Logout

**POST** `/auth/logout`

Requires: **Authorization header**

```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token"
  }'
```

---

### 5. Get Current User

**GET** `/auth/me`

Requires: **Authorization header**

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 6. Change Password

**POST** `/auth/change-password`

Requires: **Authorization header**

```bash
curl -X POST http://localhost:8000/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "old_password",
    "newPassword": "new_secure_password"
  }'
```

---

## 👤 User Profile Endpoints

All require **Authorization header**

### 1. Get My Profile

**GET** `/users/me`

```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2. Update My Profile

**PUT** `/users/me`

```bash
curl -X PUT http://localhost:8000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Updated Doe",
    "email": "newemail@example.com"
  }'
```

---

### 3. Delete My Account

**DELETE** `/users/me`

```bash
curl -X DELETE http://localhost:8000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🎯 User Preferences Endpoints

### 1. Get My Travel Preferences

**GET** `/users/me/preferences`

```bash
curl -X GET http://localhost:8000/users/me/preferences \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2. Update My Preferences

**PUT** `/users/me/preferences`

```bash
curl -X PUT http://localhost:8000/users/me/preferences \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredTravelStyles": ["Cultural", "Adventure"],
    "preferredBudgetRange": "moderate",
    "preferredStartLocation": "Colombo Port"
  }'
```

---

## 💾 Saved Itineraries Endpoints

### 1. Get My Saved Itineraries

**GET** `/users/me/saved-itineraries`

```bash
curl -X GET http://localhost:8000/users/me/saved-itineraries \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2. Save an Itinerary

**POST** `/users/me/saved-itineraries`

```bash
curl -X POST http://localhost:8000/users/me/saved-itineraries \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "combinationId": 5,
    "title": "My Dream Sri Lanka Trip",
    "notes": "Perfect for honeymoon",
    "isFavorite": true
  }'
```

---

### 3. Delete Saved Itinerary

**DELETE** `/users/me/saved-itineraries/{itinerary_id}`

```bash
curl -X DELETE http://localhost:8000/users/me/saved-itineraries/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🗺️ Travel Recommendation Endpoints

**Authentication is optional** - if provided, preferences are auto-saved

### 1. Get Recommendations

**POST** `/api/v1/recommendations`

```bash
# Without authentication
curl -X POST 'http://localhost:8000/api/v1/recommendations?travel_styles=Cultural&travel_styles=Spiritual&days=3&start_location=Colombo%20Port&budget=100000'

# With authentication (auto-saves preferences)
curl -X POST 'http://localhost:8000/api/v1/recommendations?travel_styles=Cultural&days=3&start_location=Colombo%20Port&budget=100000' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2. Get Travel Styles

**GET** `/api/v1/travel-styles`

```bash
curl http://localhost:8000/api/v1/travel-styles
```

**Response:**

```json
["Adventure", "Cultural", "Spiritual", "Nature/Wildlife"]
```

---

### 3. Get Start Locations

**GET** `/api/v1/start-locations`

```bash
curl http://localhost:8000/api/v1/start-locations
```

---

### 4. Get Budget Ranges

**GET** `/api/v1/budget-ranges`

```bash
curl http://localhost:8000/api/v1/budget-ranges
```

---

### 5. Get All Locations

**GET** `/api/v1/locations?category=cultural`

```bash
curl http://localhost:8000/api/v1/locations?category=cultural
```

---

### 6. Get Specific Combination

**GET** `/api/v1/combinations/{id}`

```bash
curl http://localhost:8000/api/v1/combinations/1
```

---

## 🧪 Complete Testing Flow

### 1. Register a new user

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "test1234",
    "fullName": "Test User"
  }'
```

**Save the `accessToken` and `refreshToken` from response!**

---

### 2. Get recommendations (authenticated)

```bash
curl -X POST 'http://localhost:8000/api/v1/recommendations?travel_styles=Cultural&days=3&start_location=Colombo%20Port&budget=100000' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 3. Save an itinerary

```bash
curl -X POST http://localhost:8000/users/me/saved-itineraries \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "combinationId": 1,
    "title": "My Favorite Trip",
    "isFavorite": true
  }'
```

---

### 4. Get saved itineraries

```bash
curl http://localhost:8000/users/me/saved-itineraries \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 Interactive API Documentation

Visit these URLs in your browser:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

You can test all endpoints directly from the Swagger UI!

---

## 🔒 Security Features Implemented

✅ **JWT Access Tokens** - Short-lived (30 min)  
✅ **JWT Refresh Tokens** - Long-lived (30 days), stored in DB  
✅ **Password Hashing** - bcrypt with salt  
✅ **Token Revocation** - Logout invalidates refresh tokens  
✅ **Role-Based Access Control** - User/Admin roles  
✅ **Activity Logging** - Track user actions  
✅ **IP & User Agent Tracking** - Security audit trail  
✅ **Token Expiry** - Automatic cleanup of expired tokens

---

## 🗄️ Database Tables

All tables created in MySQL:

1. **users** - User accounts
2. **refresh_tokens** - Active refresh tokens
3. **user_preferences** - Travel preferences
4. **saved_itineraries** - Saved trips
5. **user_activity_log** - Audit trail

---

## 🚀 Server Status

Server is running at: **http://localhost:8000**

- Health check: http://localhost:8000/
- API docs: http://localhost:8000/docs

---

## 🎉 What's Been Implemented

✅ Complete JWT authentication system  
✅ User registration and login  
✅ Access token + refresh token flow  
✅ Password hashing with bcrypt  
✅ User profile management  
✅ Travel preferences saving  
✅ Itinerary bookmarking  
✅ Protected and public endpoints  
✅ Role-based access control  
✅ Activity logging  
✅ MySQL database integration  
✅ Token revocation on logout  
✅ Automatic preference updates

Your backend is production-ready! 🎊
