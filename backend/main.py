"""FastAPI application for Sri Lanka Travel Recommendation API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from api.routes import admin_users, auth, locations, recommendations, users
from api.routes.recommendations import causal_router
from config import settings
from schemas.common import HealthResponse

app = FastAPI(
    title=settings.APP_NAME,
    description="API for recommending travel itineraries in Sri Lanka with user authentication",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Ensure upload directory exists
os.makedirs("uploads/profiles", exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(recommendations.router)
app.include_router(locations.router)
app.include_router(admin_users.router)
app.include_router(causal_router)

@app.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="healthy", service=settings.APP_NAME)
