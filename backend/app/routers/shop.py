import random
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import User, ShopItem, Order
from ..schemas import ShopItemResponse, PurchaseRequest, OrderResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/shop", tags=["Shop"])

def generate_pickup_code() -> str:
    chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"LMP-{chars}"

@router.get("/items", response_model=List[ShopItemResponse])
def get_shop_items(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(ShopItem).filter(ShopItem.is_active == True).order_by(ShopItem.price.desc()).all()
    
    result = []
    for item in items:
        # Count user's active orders for this item
        user_orders_count = (
            db.query(Order)
            .filter(
                Order.user_id == user.id,
                Order.item_id == item.id,
                Order.status != "CANCELLED"
            )
            .count()
        )

        can_buy = True
        if item.stock <= 0:
            can_buy = False
        elif user.spendable_points < item.price:
            can_buy = False
        elif item.max_per_user and user_orders_count >= item.max_per_user:
            can_buy = False

        result.append(
            ShopItemResponse(
                id=item.id,
                title=item.title,
                price=item.price,
                stock=item.stock,
                max_per_user=item.max_per_user,
                is_active=item.is_active,
                already_purchased_count=user_orders_count,
                can_buy=can_buy,
                created_at=item.created_at
            )
        )
    return result

@router.post("/purchase", response_model=OrderResponse)
def purchase_item(
    payload: PurchaseRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes merchandise purchase inside an atomic transaction with row locking
    (SELECT ... FOR UPDATE) to eliminate race conditions on limited inventory items.
    """
    # SQLite does not support FOR UPDATE, but executes in SERIALIZABLE mode
    is_sqlite = db.bind.dialect.name == "sqlite"
    query = db.query(ShopItem).filter(ShopItem.id == payload.item_id, ShopItem.is_active == True)
    if not is_sqlite:
        query = query.with_for_update()

    item = query.first()
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")

    if item.stock <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="К сожалению, данный товар закончился на складе"
        )

    # Check user balance
    # Refresh user to ensure fresh spendable points
    db.refresh(user)
    if user.spendable_points < item.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недостаточно баллов для покупки. Требуется: {item.price}, доступно: {user.spendable_points}"
        )

    # Check per-user limit
    if item.max_per_user:
        existing_count = (
            db.query(Order)
            .filter(
                Order.user_id == user.id,
                Order.item_id == item.id,
                Order.status != "CANCELLED"
            )
            .count()
        )
        if existing_count >= item.max_per_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Лимит на данный товар: не более {item.max_per_user} шт. в одни руки"
            )

    # Decrement stock and user's spendable points (rating points remain unchanged!)
    item.stock -= 1
    user.spendable_points -= item.price

    pickup_code = generate_pickup_code()
    # Ensure code uniqueness
    while db.query(Order).filter(Order.pickup_code == pickup_code).first():
        pickup_code = generate_pickup_code()

    order = Order(
        user_id=user.id,
        item_id=item.id,
        price_paid=item.price,
        pickup_code=pickup_code,
        status="PENDING_PICKUP"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return order

@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(desc(Order.created_at))
        .all()
    )
    return orders
