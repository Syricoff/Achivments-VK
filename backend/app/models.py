from datetime import datetime
import uuid
from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean, JSON,
    DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    vk_id = Column(BigInteger, unique=True, index=True, nullable=False)
    first_name = Column(String(100), default="")
    last_name = Column(String(100), default="")
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(20), default="USER") # "USER" | "ADMIN"
    rating_points = Column(Integer, default=0, index=True) # Total points for leaderboard
    spendable_points = Column(Integer, default=0) # Balance available for spending in shop
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", foreign_keys="Submission.user_id", back_populates="user")
    orders = relationship("Order", back_populates="user")
    used_qr_codes = relationship("QRCode", back_populates="user")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    points = Column(Integer, nullable=False)
    frequency = Column(String(20), default="ONCE") # "ONCE" | "DAILY"
    daily_global_limit = Column(Integer, nullable=True) # e.g. 5 for Gym-bro
    task_type = Column(String(20), default="SCREENSHOT") # "SCREENSHOT" | "QR" | "MANUAL"
    is_active = Column(Boolean, default=True)
    order_num = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="task")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    proof_image_urls = Column(JSON, nullable=False, default=list)
    comment = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING", index=True) # "PENDING" | "APPROVED" | "REJECTED"
    admin_comment = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="submissions")
    task = relationship("Task", back_populates="submissions")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])

class QRCode(Base):
    __tablename__ = "qr_codes"

    id = Column(Integer, primary_key=True, index=True)
    code_hash = Column(String(100), unique=True, index=True, nullable=False)
    points = Column(Integer, default=10)
    is_used = Column(Boolean, default=False)
    used_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="used_qr_codes")

class ShopItem(Base):
    __tablename__ = "shop_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    max_per_user = Column(Integer, nullable=True) # 1 for VIP badge
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="item")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("shop_items.id"), nullable=False, index=True)
    price_paid = Column(Integer, nullable=False)
    pickup_code = Column(String(20), unique=True, index=True, nullable=False)
    status = Column(String(30), default="PENDING_PICKUP", index=True) # "PENDING_PICKUP" | "DELIVERED" | "CANCELLED"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    item = relationship("ShopItem", back_populates="orders")
