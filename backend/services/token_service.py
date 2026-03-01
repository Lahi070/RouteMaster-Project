"""Token service for managing refresh tokens."""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from config import settings
from core.security import hash_password
from database.models import RefreshToken


class TokenService:
    """Service for managing refresh tokens in the database."""
    
    @staticmethod
    def create_refresh_token(
        db: Session,
        user_id: int,
        token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> RefreshToken:
        """
        Store a refresh token in the database.
        
        Args:
            db: Database session
            user_id: User ID
            token: Refresh token string
            user_agent: User's browser/client info
            ip_address: User's IP address
        
        Returns:
            Created RefreshToken object
        """
        # Hash the token before storing
        token_hash = hash_password(token)
        
        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        db_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        
        return db_token
    
    @staticmethod
    def get_valid_token(db: Session, user_id: int, token: str) -> Optional[RefreshToken]:
        """
        Get a valid refresh token for a user.
        
        Args:
            db: Database session
            user_id: User ID
            token: Token string to validate
        
        Returns:
            RefreshToken if valid, None otherwise
        """
        # Get all non-revoked tokens for this user
        db_tokens = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.utcnow(),
            )
            .all()
        )
        
        # Check if any token hash matches
        from core.security import verify_password
        
        for db_token in db_tokens:
            if verify_password(token, db_token.token_hash):
                return db_token
        
        return None
    
    @staticmethod
    def revoke_token(db: Session, token_id: int) -> bool:
        """
        Revoke a refresh token.
        
        Args:
            db: Database session
            token_id: Token ID to revoke
        
        Returns:
            True if revoked successfully
        """
        db_token = db.query(RefreshToken).filter(RefreshToken.id == token_id).first()
        
        if db_token:
            db_token.revoked = True
            db_token.revoked_at = datetime.utcnow()
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def revoke_all_user_tokens(db: Session, user_id: int) -> int:
        """
        Revoke all refresh tokens for a user.
        
        Args:
            db: Database session
            user_id: User ID
        
        Returns:
            Number of tokens revoked
        """
        count = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
            )
            .update(
                {"revoked": True, "revoked_at": datetime.utcnow()},
                synchronize_session=False,
            )
        )
        
        db.commit()
        return count
    
    @staticmethod
    def cleanup_expired_tokens(db: Session) -> int:
        """
        Delete expired tokens from database.
        
        Args:
            db: Database session
        
        Returns:
            Number of tokens deleted
        """
        count = (
            db.query(RefreshToken)
            .filter(RefreshToken.expires_at < datetime.utcnow())
            .delete(synchronize_session=False)
        )
        
        db.commit()
        return count
