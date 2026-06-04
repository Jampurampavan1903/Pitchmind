import os
from dotenv import load_dotenv
load_dotenv() # Load variables from .env before initializing app components

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database + ORM registries
from app.core.database import engine
from app.models.base import Base
import app.models.video      # Ensure registered for base create_all
import app.models.analysis   # Ensure registered for base create_all
import app.models.user       # Ensure registered for base create_all

# API Routers
from app.api.v1.upload import router as upload_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.ws import router as ws_router
from app.api.v1.auth import router as auth_router
from app.api.v1.developer import router as developer_router
from app.api.v1.leaderboard import router as leaderboard_router
from app.api.v1.conditioning import router as conditioning_router
from app.api.v1.assets import router as assets_router

from app.core.logging import get_logger
from app.core.schema_migrate import ensure_videos_user_id_column

logger = get_logger("pitchmind.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-bootstrap SQLite database schema asynchronously on startup
    logger.info("Bootstrapping SQLite database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(ensure_videos_user_id_column)
    logger.info("Schema initialized successfully!")
    bypass_raw = os.getenv("PITCHMIND_OTP_BYPASS_ENABLED", "False")
    logger.info(
        "OTP bypass config: PITCHMIND_OTP_BYPASS_ENABLED=%r active=%s",
        bypass_raw,
        bypass_raw.lower() in ("true", "1", "yes"),
    )
    yield

app = FastAPI(
    title="PitchMind API",
    description="Cricket batting pose estimation and biomechanics analysis engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Policy configuration
origins_env = os.getenv("CORS_ORIGINS")
if origins_env:
    origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
else:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.core.storage_paths import resolve_storage_base_dir

storage_path = resolve_storage_base_dir()
os.makedirs(storage_path, exist_ok=True)

# Include Version 1 REST and WebSocket routers
app.include_router(upload_router, prefix="/api/v1", tags=["upload"])
app.include_router(analysis_router, prefix="/api/v1", tags=["analysis"])
app.include_router(ws_router, prefix="/api/v1", tags=["websockets"])
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(developer_router, prefix="/api/v1", tags=["developer"])
app.include_router(leaderboard_router, prefix="/api/v1", tags=["leaderboard"])
app.include_router(conditioning_router, prefix="/api/v1", tags=["conditioning"])
app.include_router(assets_router, prefix="/api/v1", tags=["assets"])

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "environment": os.getenv("ENV", "development"),
        "service": "pitchmind-api"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
