import random
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import User, Task, Submission, QRCode, ShopItem, Order
from ..schemas import (
    SubmissionResponse, SubmissionReview,
    PointsGrantRequest, QRGenerateRequest, QRCodeResponse,
    OrderResponse, ShopItemResponse, ShopItemCreate, ShopItemUpdate,
    TaskResponse, TaskCreate, TaskUpdate, UserResponse
)
from ..auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

# 1. Moderation Queue
@router.get("/submissions", response_model=List[SubmissionResponse])
def get_submissions(
    status_filter: Optional[str] = Query(None, description="PENDING, APPROVED, or REJECTED"),
    db: Session = Depends(get_db)
):
    query = db.query(Submission)
    if status_filter:
        query = query.filter(Submission.status == status_filter)
    
    return query.order_by(desc(Submission.created_at)).all()

@router.post("/submissions/{submission_id}/review", response_model=SubmissionResponse)
def review_submission(
    submission_id: int,
    payload: SubmissionReview,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if submission.status == "APPROVED":
        raise HTTPException(status_code=400, detail="Заявка уже была одобрена ранее")

    if payload.status == "APPROVED":
        submission.status = "APPROVED"
        submission.admin_comment = payload.admin_comment or "Одобрено"
        submission.reviewed_by_id = admin.id

        # Award points to user: BOTH rating_points and spendable_points!
        user = submission.user
        task = submission.task
        user.rating_points += task.points
        user.spendable_points += task.points

    elif payload.status == "REJECTED":
        submission.status = "REJECTED"
        submission.admin_comment = payload.admin_comment or "Отклонено организатором"
        submission.reviewed_by_id = admin.id
    else:
        raise HTTPException(status_code=400, detail="Неверный статус проверки")

    db.commit()
    db.refresh(submission)
    return submission

# 2. Manual and Group Points Grant
@router.post("/points/grant")
def grant_points(
    payload: PointsGrantRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if payload.points <= 0:
        raise HTTPException(status_code=400, detail="Количество баллов должно быть больше 0")

    awarded_users = []
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        user.rating_points += payload.points
        user.spendable_points += payload.points
        awarded_users.append(f"{user.first_name} {user.last_name}")

    elif payload.team_name:
        users = db.query(User).filter(User.team_name == payload.team_name).all()
        if not users:
            raise HTTPException(status_code=404, detail=f"Участники в команде '{payload.team_name}' не найдены")
        for u in users:
            u.rating_points += payload.points
            u.spendable_points += payload.points
            awarded_users.append(f"{u.first_name} {u.last_name}")
    else:
        raise HTTPException(status_code=400, detail="Необходимо указать user_id или team_name")

    db.commit()
    return {
        "success": True,
        "message": f"Начислено +{payload.points} баллов ({payload.reason})",
        "affected_users": awarded_users
    }

@router.post("/points/random-lucky")
def pick_random_lucky(
    points: int = 50,
    count: int = 5,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Chooses random participants for the 'Счастливчик дня' daily challenge.
    """
    all_users = db.query(User).all()
    if not all_users:
        raise HTTPException(status_code=400, detail="Нет зарегистрированных участников")

    lucky_count = min(count, len(all_users))
    selected = random.sample(all_users, lucky_count)

    lucky_names = []
    for u in selected:
        u.rating_points += points
        u.spendable_points += points
        lucky_names.append(f"{u.first_name} {u.last_name}")

    db.commit()
    return {
        "success": True,
        "message": f"Счастливчики дня выбраны! Начислено по +{points} баллов каждому",
        "winners": lucky_names
    }

# 3. QR Generator for Detective Task
@router.post("/qr/generate", response_model=List[QRCodeResponse])
def generate_qr_codes(
    payload: QRGenerateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    created = []
    for _ in range(payload.count):
        code_str = f"LAMPA-QR-{uuid.uuid4().hex[:8].upper()}"
        qr = QRCode(
            code_hash=code_str,
            points=payload.points,
            is_used=False
        )
        db.add(qr)
        created.append(qr)
    db.commit()
    for qr in created:
        db.refresh(qr)
    return created

@router.get("/qr/list", response_model=List[QRCodeResponse])
def list_qr_codes(db: Session = Depends(get_db)):
    return db.query(QRCode).order_by(desc(QRCode.created_at)).all()

# 4. Orders and Shop Management
@router.get("/orders", response_model=List[OrderResponse])
def list_orders(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.order_by(desc(Order.created_at)).all()

@router.post("/orders/{order_id}/deliver", response_model=OrderResponse)
def deliver_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    order.status = "DELIVERED"
    db.commit()
    db.refresh(order)
    return order

@router.post("/shop/items", response_model=ShopItemResponse)
def create_shop_item(payload: ShopItemCreate, db: Session = Depends(get_db)):
    item = ShopItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/shop/items/{item_id}", response_model=ShopItemResponse)
def update_shop_item(item_id: int, payload: ShopItemUpdate, db: Session = Depends(get_db)):
    item = db.query(ShopItem).filter(ShopItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, val)
    db.commit()
    db.refresh(item)
    return item

# 5. Task CRUD
@router.get("/tasks", response_model=List[TaskResponse])
def admin_list_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.order_num, Task.id).all()

@router.post("/tasks", response_model=TaskResponse)
def admin_create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
def admin_update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задание не найдено")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, val)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
def admin_delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задание не найдено")
    task.is_active = False # Soft delete
    db.commit()
    return {"success": True, "message": "Задание архивировано"}

@router.get("/users", response_model=List[UserResponse])
def admin_list_users(
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(User)
    if query:
        q = q.filter(
            (User.first_name.ilike(f"%{query}%")) | 
            (User.last_name.ilike(f"%{query}%")) |
            (User.team_name.ilike(f"%{query}%"))
        )
    return q.order_by(desc(User.rating_points)).all()
