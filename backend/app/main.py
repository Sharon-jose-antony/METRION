import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.api import (
    auth, users, instruments, applications, schedules, assignments,
    verifications, certificates, public, rules, dashboard, notifications, audit
)
from app.seed import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Online Verification, Certification & Lifecycle Management System for Weighing and Measuring Instruments (SIH26036)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for evidence and PDFs
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.STORAGE_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(instruments.router, prefix=settings.API_V1_STR)
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(schedules.router, prefix=settings.API_V1_STR)
app.include_router(assignments.router, prefix=settings.API_V1_STR)
app.include_router(verifications.router, prefix=settings.API_V1_STR)
app.include_router(certificates.router, prefix=settings.API_V1_STR)
app.include_router(public.router, prefix=settings.API_V1_STR)
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_populate_demo_data():
    seed_database()

@app.get("/")
def root():
    return {
        "product": settings.PROJECT_NAME,
        "purpose": "Digitizing statutory verification lifecycle for weighing and measuring instruments",
        "version": settings.VERSION,
        "docs": "/docs",
        "disclaimer": settings.DEMO_DISCLAIMER
    }
