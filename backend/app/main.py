from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base, migrate_submission_proof_images
from .routers import users, tasks, shop, qr, admin, upload

# Create tables
migrate_submission_proof_images()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API для VK Mini App «Лампа 2026»",
    version="1.0.0"
)

# CORS setup for VK iframe embedding
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static directory
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(shop.router)
app.include_router(qr.router)
app.include_router(admin.router)
app.include_router(upload.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.ENV}
