"""Authentication service."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from core.exceptions import AuthenticationError
from core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    verify_refresh_token,
    hash_password,
)
from datetime import timedelta
from database.models import User
from schemas.auth import Tokens
from services.token_service import TokenService
from services.user_service import UserService
from services.email_service import EmailService
import secrets
from database.models import PasswordResetToken


class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    def register(
        db: Session,
        email: str,
        username: str,
        password: str,
        full_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> tuple[User, Tokens]:
        """
        Register a new user and return tokens.
        
        Args:
            db: Database session
            email: User email
            username: Username
            password: Plain text password
            full_name: User's full name
            ip_address: User's IP address
            user_agent: User's browser/client info
        
        Returns:
            Tuple of (User, Tokens)
        """
        # Create user
        user = UserService.create_user(db, email, username, password, full_name)
        
        # Log activity
        UserService.log_activity(db, user.id, "register", ip_address, user_agent)
        
        # Generate tokens
        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id)
        
        # Store refresh token
        TokenService.create_refresh_token(
            db, user.id, refresh_token, user_agent, ip_address
        )
        
        tokens = Tokens(
            access_token=access_token,
            refresh_token=refresh_token,
        )
        
        return user, tokens
    
    @staticmethod
    def login(
        db: Session,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> tuple[User, Tokens]:
        """
        Authenticate user and return tokens.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            ip_address: User's IP address
            user_agent: User's browser/client info
        
        Returns:
            Tuple of (User, Tokens)
        
        Raises:
            AuthenticationError: If credentials are invalid
        """
        # Get user
        user = UserService.get_by_email(db, email)
        
        if not user:
            raise AuthenticationError("Invalid email or password")
        
        # Verify password
        if not verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise AuthenticationError("Account is disabled")
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Log activity
        UserService.log_activity(db, user.id, "login", ip_address, user_agent)
        
        # Generate tokens
        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id)
        
        # Store refresh token
        TokenService.create_refresh_token(
            db, user.id, refresh_token, user_agent, ip_address
        )
        
        tokens = Tokens(
            access_token=access_token,
            refresh_token=refresh_token,
        )
        
        return user, tokens
    
    @staticmethod
    def refresh_access_token(
        db: Session,
        refresh_token: str,
    ) -> Tokens:
        """
        Generate new access token from refresh token.
        
        Args:
            db: Database session
            refresh_token: Valid refresh token
        
        Returns:
            Tokens with new access token (same refresh token)
        
        Raises:
            AuthenticationError: If refresh token is invalid
        """
        # Verify refresh token
        payload = verify_refresh_token(refresh_token)
        
        if not payload:
            raise AuthenticationError("Invalid refresh token")
        
        user_id = int(payload["sub"])
        
        # Check if token exists in database and is not revoked
        db_token = TokenService.get_valid_token(db, user_id, refresh_token)
        
        if not db_token:
            raise AuthenticationError("Refresh token expired or revoked")
        
        # Get user
        user = UserService.get_by_id(db, user_id)
        
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        
        # Generate new access token
        access_token = create_access_token(user.id, user.role)
        
        return Tokens(
            access_token=access_token,
            refresh_token=refresh_token,
        )
    
    @staticmethod
    def logout(db: Session, user_id: int, refresh_token: str) -> bool:
        """
        Logout user by revoking refresh token.
        
        Args:
            db: Database session
            user_id: User ID
            refresh_token: Token to revoke
        
        Returns:
            True if logout successful
        """
        # Find and revoke the token
        db_token = TokenService.get_valid_token(db, user_id, refresh_token)
        
        if db_token:
            TokenService.revoke_token(db, db_token.id)
            UserService.log_activity(db, user_id, "logout")
            return True
        
        return False
    
    @staticmethod
    def logout_all(db: Session, user_id: int) -> int:
        """
        Logout user from all devices by revoking all refresh tokens.
        
        Args:
            db: Database session
            user_id: User ID
        
        Returns:
            Number of tokens revoked
        """
        count = TokenService.revoke_all_user_tokens(db, user_id)
        UserService.log_activity(db, user_id, "logout_all")
        return count
    
    @staticmethod
    def forgot_password(db: Session, email: str) -> bool:
        """Generate and send password reset token."""
        user = UserService.get_by_email(db, email)
        if not user or not user.is_active:
            # Return true to prevent email enumeration
            return True
            
        token_plain = secrets.token_urlsafe(32)
        token_hash = hash_password(token_plain)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()
        
        EmailService.send_password_reset_email(email, token_plain)
        UserService.log_activity(db, user.id, "password_reset_requested")
        return True

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> bool:
        """Reset password using token."""
        # Find all unexpired, unused tokens
        valid_tokens = db.query(PasswordResetToken).filter(
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).all()
        
        matched_token = None
        for t in valid_tokens:
            if verify_password(token, t.token_hash):
                matched_token = t
                break
                
        if not matched_token:
            raise AuthenticationError("Invalid or expired password reset token")
            
        user = UserService.get_by_id(db, matched_token.user_id)
        if not user or not user.is_active:
            raise AuthenticationError("Invalid user account")
            
        # Update password
        user.password_hash = hash_password(new_password)
        matched_token.used = True
        
        # Revoke all active sessions
        TokenService.revoke_all_user_tokens(db, user.id)
        
        db.commit()
        UserService.log_activity(db, user.id, "password_reset_completed")
        return True
