import json
from datetime import datetime
from urllib.parse import parse_qs, unquote, urlparse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, QRCode, Task, Submission
from ..schemas import QRScanRequest
from ..auth import get_current_user

router = APIRouter(prefix="/api/qr", tags=["QR Codes"])


def normalize_qr_code(value: str) -> str:
    code = unquote(value).strip()
    if code.startswith("{"):
        try:
            data = json.loads(code)
            code = str(data.get("code") or data.get("code_hash") or code)
        except (json.JSONDecodeError, AttributeError):
            pass

    parsed = urlparse(code)
    if parsed.scheme and parsed.netloc:
        query = parse_qs(parsed.query)
        code = next(
            (query[key][0] for key in ("code", "qr", "token") if query.get(key)),
            parsed.path.rstrip("/").split("/")[-1],
        )

    return unquote(code).strip().upper()

@router.post("/scan")
def scan_qr_code(
    payload: QRScanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code_text = normalize_qr_code(payload.code)
    qr = db.query(QRCode).filter(func.upper(QRCode.code_hash) == code_text).first()
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

    claimed = (
        db.query(QRCode)
        .filter(QRCode.id == qr.id, QRCode.is_used.is_(False))
        .update(
            {
                QRCode.is_used: True,
                QRCode.used_by_user_id: user.id,
                QRCode.used_at: datetime.utcnow(),
            },
            synchronize_session=False,
        )
    )
    if not claimed:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот QR-код уже был отсканирован другим участником ранее",
        )
    db.refresh(qr)

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
