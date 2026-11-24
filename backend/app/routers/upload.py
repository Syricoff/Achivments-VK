import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..config import settings

router = APIRouter(prefix="/api/upload", tags=["Upload"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "upload.png"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".png"

    unique_name = f"{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/{unique_name}"
    return {"url": file_url, "filename": unique_name}
