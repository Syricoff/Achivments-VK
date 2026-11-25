import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from ..config import settings
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api/upload", tags=["Upload"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_SIZE = 8 * 1024 * 1024

@router.post("")
async def upload_file(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    filename = file.filename or "upload.png"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".png"

    unique_name = f"{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    content = await file.read(MAX_UPLOAD_SIZE + 1)
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Размер файла не должен превышать 8 МБ")

    with open(target_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/{unique_name}"
    return {"url": file_url, "filename": unique_name}
