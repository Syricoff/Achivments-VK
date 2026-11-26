from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# User Schemas
class UserBase(BaseModel):
    vk_id: int
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    role: str = "USER"
    rating_points: int = 0
    spendable_points: int = 0

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LeaderboardEntry(BaseModel):
    id: int
    vk_id: int
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    rating_points: int
    rank: int
    model_config = ConfigDict(from_attributes=True)

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: str
    points: int
    frequency: str = "ONCE" # ONCE or DAILY
    daily_global_limit: Optional[int] = None
    task_type: str = "SCREENSHOT" # SCREENSHOT, QR, MANUAL
    is_active: bool = True
    order_num: int = 0

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    points: Optional[int] = None
    frequency: Optional[str] = None
    daily_global_limit: Optional[int] = None
    task_type: Optional[str] = None
    is_active: Optional[bool] = None
    order_num: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    user_status: str = "AVAILABLE" # AVAILABLE, PENDING, APPROVED, REJECTED
    user_submission_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    today_submissions_count: int = 0
    can_submit: bool = True
    model_config = ConfigDict(from_attributes=True)

# Submission Schemas
class SubmissionCreate(BaseModel):
    task_id: int
    proof_image_urls: List[str] = Field(min_length=1, max_length=5)
    comment: Optional[str] = None

class SubmissionReview(BaseModel):
    status: str # APPROVED or REJECTED
    admin_comment: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: int
    user_id: int
    task_id: int
    proof_image_urls: List[str]
    comment: Optional[str] = None
    status: str
    admin_comment: Optional[str] = None
    created_at: datetime
    user: Optional[UserBase] = None
    task: Optional[TaskBase] = None
    model_config = ConfigDict(from_attributes=True)

# Shop Schemas
class ShopItemBase(BaseModel):
    title: str
    price: int
    stock: int
    max_per_user: Optional[int] = None
    is_active: bool = True

class ShopItemCreate(ShopItemBase):
    pass

class ShopItemUpdate(BaseModel):
    title: Optional[str] = None
    price: Optional[int] = None
    stock: Optional[int] = None
    max_per_user: Optional[int] = None
    is_active: Optional[bool] = None

class ShopItemResponse(ShopItemBase):
    id: int
    already_purchased_count: int = 0
    can_buy: bool = True
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PurchaseRequest(BaseModel):
    item_id: int

class OrderDeliveryRequest(BaseModel):
    pickup_code: str

class OrderResponse(BaseModel):
    id: int
    user_id: int
    item_id: int
    price_paid: int
    pickup_code: str
    status: str
    created_at: datetime
    item: Optional[ShopItemBase] = None
    user: Optional[UserBase] = None
    model_config = ConfigDict(from_attributes=True)

# QR Code Schemas
class QRScanRequest(BaseModel):
    code: str

class QRGenerateRequest(BaseModel):
    points: int = 10
    count: int = 1

class QRCodeResponse(BaseModel):
    id: int
    code_hash: str
    points: int
    is_used: bool
    used_at: Optional[datetime] = None
    used_by_user_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Admin Grant
class PointsGrantRequest(BaseModel):
    user_id: int
    points: int
    reason: str
