import random
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, desc, String

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

# 2. Individual points grant
@router.post("/points/grant")
def grant_points(
    payload: PointsGrantRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if payload.points <= 0:
        raise HTTPException(status_code=400, detail="Количество баллов должно быть больше 0")

    user = db.query(User).filter(User.id == payload.user_id, User.role == "USER").first()
    if not user:
        raise HTTPException(status_code=404, detail="Участник не найден")

    user.rating_points += payload.points
    user.spendable_points += payload.points
    participant_name = f"{user.first_name} {user.last_name}".strip() or f"VK ID {user.vk_id}"

    db.commit()
    return {
        "success": True,
        "message": f"{participant_name} (VK ID {user.vk_id}): +{payload.points} баллов. {payload.reason}",
        "affected_user": {
            "id": user.id,
            "vk_id": user.vk_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "rating_points": user.rating_points,
            "spendable_points": user.spendable_points,
        },
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
    all_users = db.query(User).filter(User.role == "USER").all()
    if not all_users:
        raise HTTPException(status_code=400, detail="Нет зарегистрированных участников")
    if points <= 0 or count <= 0:
        raise HTTPException(status_code=400, detail="Количество участников и баллов должно быть больше 0")

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
    q = q.filter(User.role == "USER")
    if query:
        q = q.filter(
            (User.first_name.ilike(f"%{query}%")) | 
            (User.last_name.ilike(f"%{query}%")) |
            (cast(User.vk_id, String).ilike(f"%{query}%"))
        )
    return q.order_by(User.last_name, User.first_name, User.id).all()
