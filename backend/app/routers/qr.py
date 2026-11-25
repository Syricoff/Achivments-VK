from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, QRCode, Task, Submission
from ..schemas import QRScanRequest
from ..auth import get_current_user

router = APIRouter(prefix="/api/qr", tags=["QR Codes"])

@router.post("/scan")
def scan_qr_code(
    payload: QRScanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code_text = payload.code.strip()
    
    qr = db.query(QRCode).filter(QRCode.code_hash == code_text).first()
    if not qr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Недействительный или не существующий QR-код"
        )

    if qr.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот QR-код уже был отсканирован другим участником ранее"
        )

    # Award points
    qr.is_used = True
    qr.used_by_user_id = user.id
    qr.used_at = datetime.utcnow()

    user.rating_points += qr.points
    user.spendable_points += qr.points

    # Associate with task #4 "Сыщик" if available
    detective_task = db.query(Task).filter(Task.title.ilike("%Сыщик%")).first()
    if detective_task:
        submission = Submission(
            user_id=user.id,
            task_id=detective_task.id,
            proof_image_urls=[],
            comment=f"Успешное сканирование QR-кода: {code_text}",
            status="APPROVED",
            admin_comment="Автоматически начислено за QR-код"
        )
        db.add(submission)

    db.commit()

    return {
        "success": True,
        "message": f"Поздравляем! QR-код найден! Начислено +{qr.points} баллов!",
        "points_earned": qr.points,
        "new_rating_points": user.rating_points,
        "new_spendable_points": user.spendable_points
    }
