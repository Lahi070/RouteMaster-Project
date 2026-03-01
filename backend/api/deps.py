"""API dependencies for authentication and authorization."""

from typing import Optional

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.exceptions import AuthenticationError, UnauthorizedError
from core.security import verify_access_token
from database import get_db
from database.models import User
from services.user_service import UserService

# HTTP Bearer token security
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user.
    
    Args:
        credentials: HTTP Bearer token
        db: Database session
    
    Returns:
        Current authenticated User
    
    Raises:
        AuthenticationError: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Verify token
    payload = verify_access_token(token)
    
    if not payload:
        raise AuthenticationError("Could not validate credentials")
    
    # Get user ID from token
    user_id = int(payload.get("sub", 0))
    
    if not user_id:
        raise AuthenticationError("Invalid token payload")
    
    # Get user from database
    user = UserService.get_by_id(db, user_id)
    
    if not user:
        raise AuthenticationError("User not found")
    
    if not user.is_active:
        raise AuthenticationError("User account is inactive")
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to ensure user is active.
    
    Args:
        current_user: Current user from token
    
    Returns:
        Current active User
    
    Raises:
        AuthenticationError: If user is inactive
    """
    if not current_user.is_active:
        raise AuthenticationError("User account is inactive")
    
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to require admin role.
    
    Args:
        current_user: Current user from token
    
    Returns:
        Current user if admin
    
    Raises:
        UnauthorizedError: If user is not an admin
    """
    if current_user.role != "admin":
        raise UnauthorizedError("Admin access required")
    
    return current_user


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Dependency to optionally get current user (doesn't require authentication).
    
    Args:
        request: HTTP request
        db: Database session
    
    Returns:
        Current User if authenticated, None otherwise
    """
    # Try to get token from Authorization header
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.replace("Bearer ", "")
    
    # Verify token
    payload = verify_access_token(token)
    
    if not payload:
        return None
    
    # Get user
    user_id = int(payload.get("sub", 0))
    
    if not user_id:
        return None
    
    user = UserService.get_by_id(db, user_id)
    
    return user if user and user.is_active else None


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    # Check for forwarded IP (when behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """Get user agent from request."""
    return request.headers.get("User-Agent", "unknown")
