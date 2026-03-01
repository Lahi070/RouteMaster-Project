"""Authentication routes."""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from api.deps import get_client_ip, get_current_user, get_user_agent
from config import settings
from database import get_db
from database.models import User
from schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from schemas.common import MessageResponse
from schemas.user import UserResponse
from services.auth_service import AuthService
from core.security import hash_password, verify_password
from core.exceptions import AuthenticationError

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Cookie configuration
REFRESH_TOKEN_COOKIE_NAME = "refreshToken"
COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # Convert days to seconds


@router.post("/register", response_model=dict)
async def register(
    request: Request,
    response: Response,
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new user account.
    
    - **email**: Valid email address
    - **username**: Unique username (3-50 characters)
    - **password**: Password (minimum 8 characters)
    - **full_name**: Optional full name
    
    Returns access token in body and refresh token in httpOnly cookie.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    user, tokens = AuthService.register(
        db=db,
        email=data.email,
        username=data.username,
        password=data.password,
        full_name=data.full_name,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        value=tokens.refresh_token,
        httponly=True,
        secure=not settings.DEBUG,  # HTTPS only in production
        samesite="strict",
        max_age=COOKIE_MAX_AGE,
        path="/auth",  # Only sent to /auth endpoints
    )
    
    return {
        "user": UserResponse.model_validate(user),
        "accessToken": tokens.access_token,
        "tokenType": "bearer",
    }


@router.post("/login", response_model=dict)
async def login(
    request: Request,
    response: Response,
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Login with email and password.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns access token in body and refresh token in httpOnly cookie.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    user, tokens = AuthService.login(
        db=db,
        email=data.email,
        password=data.password,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        value=tokens.refresh_token,
        httponly=True,
        secure=not settings.DEBUG,  # HTTPS only in production
        samesite="strict",
        max_age=COOKIE_MAX_AGE,
        path="/auth",  # Only sent to /auth endpoints
    )
    
    return {
        "user": UserResponse.model_validate(user),
        "accessToken": tokens.access_token,
        "tokenType": "bearer",
    }


@router.post("/refresh", response_model=dict)
async def refresh_token(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Refresh access token using refresh token from httpOnly cookie.
    
    The refresh token is automatically sent by the browser in the cookie.
    Returns new access token in response body.
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
    
    if not refresh_token:
        raise AuthenticationError("Refresh token not found in cookie")
    
    tokens = AuthService.refresh_access_token(db, refresh_token)
    
    return {
        "accessToken": tokens.access_token,
        "tokenType": "bearer",
    }


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Logout user by revoking refresh token from httpOnly cookie.
    
    Requires authentication (access token in Authorization header).
    Clears the refresh token cookie.
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
    
    if refresh_token:
        AuthService.logout(db, current_user.id, refresh_token)
    
    # Clear the refresh token cookie
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        path="/auth"
    )
    
    return MessageResponse(message="Logged out successfully")


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Logout from all devices by revoking all refresh tokens.
    
    Requires authentication (access token in Authorization header).
    Clears the refresh token cookie.
    """
    count = AuthService.logout_all(db, current_user.id)
    
    # Clear the refresh token cookie
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        path="/auth"
    )
    
    return MessageResponse(message=f"Logged out from {count} device(s)")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change user password.
    
    - **currentPassword**: Current password
    - **newPassword**: New password (minimum 8 characters)
    
    Requires authentication.
    Clears all refresh token cookies for security.
    """
    # Verify current password
    if not verify_password(data.current_password, current_user.password_hash):
        raise AuthenticationError("Current password is incorrect")
    
    # Update password
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    
    # Revoke all refresh tokens for security
    AuthService.logout_all(db, current_user.id)
    
    # Clear the refresh token cookie
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        path="/auth"
    )
    
    return MessageResponse(message="Password changed successfully. Please login again.")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user information.
    
    Requires authentication (access token in Authorization header).
    """
    return UserResponse.model_validate(current_user)
