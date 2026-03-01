"""Admin user management routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.deps import require_admin
from database import get_db
from database.models import User
from schemas.user import UserResponse

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


@router.get("", response_model=list[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    role: Optional[str] = Query(None, description="Filter by role (user or admin)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all users (Admin only).
    
    - **skip**: Number of records to skip for pagination
    - **limit**: Maximum number of records to return (1-500)
    - **role**: Filter by user role (user or admin)
    
    Returns list of users.
    """
    query = db.query(User)
    
    # Apply role filter if provided
    if role:
        query = query.filter(User.role == role)
    
    # Apply pagination and order by ID
    users = query.order_by(User.id).offset(skip).limit(limit).all()
    
    return [UserResponse.model_validate(user) for user in users]
