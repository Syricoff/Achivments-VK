from datetime import datetime, time
import pytz
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_

from ..database import get_db
from ..models import User, Task, Submission
from ..schemas import TaskResponse, SubmissionCreate, SubmissionResponse
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

def get_moscow_day_range():
    tz = pytz.timezone(settings.TIMEZONE)
    now_msk = datetime.now(tz)
    start_msk = tz.localize(datetime.combine(now_msk.date(), time.min))
    end_msk = tz.localize(datetime.combine(now_msk.date(), time.max))
    # Convert to UTC naive datetime for DB query
    start_utc = start_msk.astimezone(pytz.UTC).replace(tzinfo=None)
    end_utc = end_msk.astimezone(pytz.UTC).replace(tzinfo=None)
    return start_utc, end_utc

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).filter(Task.is_active == True).order_by(Task.order_num, Task.id).all()
    start_utc, end_utc = get_moscow_day_range()

    response: List[TaskResponse] = []
    for t in tasks:
        # Check today's global limit count if any
        today_submissions_count = (
            db.query(func.count(Submission.id))
            .filter(
                Submission.task_id == t.id,
                Submission.status.in_(["PENDING", "APPROVED"]),
                Submission.created_at >= start_utc,
                Submission.created_at <= end_utc
            )
            .scalar() or 0
        )

        # Check current user's submission
        if t.frequency == "DAILY":
            user_sub = (
                db.query(Submission)
                .filter(
                    Submission.task_id == t.id,
                    Submission.user_id == user.id,
                    Submission.created_at >= start_utc,
                    Submission.created_at <= end_utc
                )
                .order_by(desc(Submission.id))
                .first()
            )
        else: # ONCE
            user_sub = (
                db.query(Submission)
                .filter(
                    Submission.task_id == t.id,
                    Submission.user_id == user.id
                )
                .order_by(desc(Submission.id))
                .first()
            )

        user_status = "AVAILABLE"
        rejection_reason = None
        user_submission_id = None
        can_submit = True

        if user_sub:
            user_submission_id = user_sub.id
            if user_sub.status == "APPROVED":
                user_status = "APPROVED"
                can_submit = False
            elif user_sub.status == "PENDING":
                user_status = "PENDING"
                can_submit = False
            elif user_sub.status == "REJECTED":
                user_status = "REJECTED"
                rejection_reason = user_sub.admin_comment
                can_submit = True # Allowed to retry

        # Check global limit reached for today
        if t.daily_global_limit and today_submissions_count >= t.daily_global_limit and user_status == "AVAILABLE":
            can_submit = False

        item = TaskResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            points=t.points,
            frequency=t.frequency,
            daily_global_limit=t.daily_global_limit,
            task_type=t.task_type,
            is_active=t.is_active,
            order_num=t.order_num,
            created_at=t.created_at,
            user_status=user_status,
            user_submission_id=user_submission_id,
            rejection_reason=rejection_reason,
            today_submissions_count=today_submissions_count,
            can_submit=can_submit
        )
        response.append(item)

    return response

@router.post("/submissions", response_model=SubmissionResponse)
def submit_task(
    payload: SubmissionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == payload.task_id, Task.is_active == True).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задание не найдено")

    start_utc, end_utc = get_moscow_day_range()

    # Check daily limit
    if task.daily_global_limit:
        today_submissions_count = (
            db.query(func.count(Submission.id))
            .filter(
                Submission.task_id == task.id,
                Submission.status.in_(["PENDING", "APPROVED"]),
                Submission.created_at >= start_utc,
                Submission.created_at <= end_utc
            )
            .scalar() or 0
        )
        if today_submissions_count >= task.daily_global_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Лимит выполнений задания на сегодня исчерпан ({task.daily_global_limit} чел.)"
            )

    # Check existing submission
    if task.frequency == "DAILY":
        existing = (
            db.query(Submission)
            .filter(
                Submission.task_id == task.id,
                Submission.user_id == user.id,
                Submission.status.in_(["PENDING", "APPROVED"]),
                Submission.created_at >= start_utc,
                Submission.created_at <= end_utc
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы уже отправили отчет по этому заданию сегодня"
            )
    else: # ONCE
        existing = (
            db.query(Submission)
            .filter(
                Submission.task_id == task.id,
                Submission.user_id == user.id,
                Submission.status.in_(["PENDING", "APPROVED"])
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Это единоразовое задание уже выполнено или находится на проверке"
            )

    submission = Submission(
        user_id=user.id,
        task_id=task.id,
        proof_image_urls=payload.proof_image_urls,
        comment=payload.comment,
        status="PENDING"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.get("/my-submissions", response_model=List[SubmissionResponse])
def get_my_submissions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Submission)
        .filter(Submission.user_id == user.id)
        .order_by(desc(Submission.created_at))
        .all()
    )
