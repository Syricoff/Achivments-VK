from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import User
from ..schemas import UserResponse, LeaderboardEntry
from ..auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user

@router.put("/me", response_model=UserResponse)
def update_profile(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if avatar_url is not None:
        user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    return user

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    users = (
        db.query(User)
        .filter(User.role == "USER")
        .order_by(desc(User.rating_points), User.id)
        .limit(100)
        .all()
    )
    result = []
    for rank, u in enumerate(users, start=1):
        result.append(
            LeaderboardEntry(
                id=u.id,
                vk_id=u.vk_id,
                first_name=u.first_name or "Участник",
                last_name=u.last_name or f"#{u.id}",
                avatar_url=u.avatar_url,
                rating_points=u.rating_points,
                rank=rank
            )
        )
    return result
