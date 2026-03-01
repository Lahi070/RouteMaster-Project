"""Authentication-related Pydantic schemas."""

from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, EmailStr, Field


@dataclass
class Tokens:
    """Internal dataclass to hold both tokens (not exposed in API)."""
    
    access_token: str
    refresh_token: str


class RegisterRequest(BaseModel):
    """User registration request."""
    
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str | None = Field(None, max_length=255)


class LoginRequest(BaseModel):
    """User login request."""
    
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response after login/register (refresh token in httpOnly cookie)."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    access_token: str = Field(..., alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")


class RefreshTokenRequest(BaseModel):
    """Request to refresh access token (token read from httpOnly cookie)."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    # No fields needed - token comes from cookie


class ChangePasswordRequest(BaseModel):
    """Request to change password."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    current_password: str = Field(..., alias="currentPassword")
    new_password: str = Field(..., min_length=8, max_length=100, alias="newPassword")
