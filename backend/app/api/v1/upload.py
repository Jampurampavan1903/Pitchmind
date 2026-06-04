import io

from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.analysis import Analysis
from app.api.v1.auth import get_auth_user_id
from app.core.ownership import get_owned_video
from app.services.storage_service import StorageService
from app.services.upload_service import UploadService
from app.schemas.upload import UploadResponse, UploadStatusResponse
from app.workers.progress_store import PROGRESS_STORE
from datetime import datetime

router = APIRouter()
storage_service = StorageService()


def _progress_from_db(video_status: str, analysis_status: str, error_message: str | None) -> dict:
    """Rebuild poll payload when in-memory PROGRESS_STORE was lost (process restart)."""
    if video_status == "failed" or analysis_status == "failed":
        return {
            "status": "failed",
            "progress_pct": 0.0,
            "current_step": "failed",
            "error_message": error_message or "Analysis failed",
        }
    if video_status == "complete" or analysis_status == "complete":
        return {
            "status": "complete",
            "progress_pct": 100.0,
            "current_step": "complete",
        }
    if video_status == "processing" or analysis_status == "processing":
        return {
            "status": "processing",
            "progress_pct": 10.0,
            "current_step": "processing",
        }
    return {
        "status": "queued",
        "progress_pct": 0.0,
        "current_step": "queued",
        "message": "Upload received; analysis starting",
    }


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_auth_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Authenticated upload — video is owned by the current user."""
    try:
        contents = await file.read()
        size = len(contents)
        if size <= 0:
            raise HTTPException(status_code=400, detail="Empty upload body")

        uploader = UploadService(db, storage_service)
        db_video = await uploader.handle_upload(
            filename=file.filename or "upload.mp4",
            file_data=io.BytesIO(contents),
            file_size_bytes=size,
            user_id=user_id,
        )

        from app.workers.analysis_worker import process_video_task

        # Seed progress before background worker runs (avoids 404 on immediate poll)
        PROGRESS_STORE[db_video.id] = {
            "status": "queued",
            "progress_pct": 0.0,
            "current_step": "queued",
            "message": "Upload received; analysis starting",
        }

        background_tasks.add_task(
            process_video_task,
            video_id=db_video.id,
            storage=storage_service,
        )

        return UploadResponse(
            video_id=db_video.id,
            filename=db_video.original_name,
            status="uploaded",
            created_at=datetime.utcnow(),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal upload error: {str(e)}")


@router.get("/upload/{video_id}/status", response_model=UploadStatusResponse)
async def get_upload_status(
    video_id: str,
    user_id: str = Depends(get_auth_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Progress polling — only for videos owned by the authenticated user."""
    video = await get_owned_video(db, video_id, user_id)

    progress = PROGRESS_STORE.get(video_id)
    if not progress:
        analysis_row = (
            await db.execute(select(Analysis).where(Analysis.video_id == video_id))
        ).scalars().first()
        analysis_status = analysis_row.status if analysis_row else "pending"
        error_message = analysis_row.error_message if analysis_row else None
        progress = _progress_from_db(video.status, analysis_status, error_message)

    return UploadStatusResponse(
        video_id=video_id,
        status=progress["status"],
        progress_pct=progress["progress_pct"],
        current_step=progress["current_step"],
        message=progress.get("message"),
        error_message=progress.get("error_message"),
    )
