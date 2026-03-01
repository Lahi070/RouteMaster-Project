"""Pydantic schemas package."""

from schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from schemas.common import HealthResponse, MessageResponse
from schemas.user import (
    SavedItineraryCreate,
    SavedItineraryResponse,
    SavedItineraryUpdate,
    UserPreferenceResponse,
    UserPreferenceUpdate,
    UserResponse,
    UserUpdate,
)

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "ChangePasswordRequest",
    "UserResponse",
    "UserUpdate",
    "UserPreferenceResponse",
    "UserPreferenceUpdate",
    "SavedItineraryResponse",
    "SavedItineraryCreate",
    "SavedItineraryUpdate",
    "MessageResponse",
    "HealthResponse",
]
