from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.storage_service import StorageService
from app.services.upload_service import UploadService
from app.schemas.upload import UploadResponse, UploadStatusResponse
from app.workers.analysis_worker import process_video_task, PROGRESS_STORE
from datetime import datetime

router = APIRouter()
storage_service = StorageService()

@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Saves an uploaded raw batting video file, registers database logs,
    and enqueues the AI pose/biomechanics pipeline worker as a background task.
    """
    try:
        # Resolve file size in memory for validation
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        uploader = UploadService(db, storage_service)
        db_video = await uploader.handle_upload(
            filename=file.filename,
            file_data=file.file,
            file_size_bytes=size
        )
        
        # Schedule the AI processing task to run in the background
        background_tasks.add_task(
            process_video_task,
            video_id=db_video.id,
            storage=storage_service
        )
        
        return UploadResponse(
            video_id=db_video.id,
            filename=db_video.original_name,
            status="uploaded",
            created_at=datetime.utcnow()
        )
        
    except ValueError as e:
        # Enforce size / extension constraints (HTTP 400 validation error)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal upload error: {str(e)}")

@router.get("/upload/{video_id}/status", response_model=UploadStatusResponse)
async def get_upload_status(video_id: str):
    """Fallback polling endpoint to fetch active video analysis progress."""
    progress = PROGRESS_STORE.get(video_id)
    if not progress:
        # If not active in store, return simple completed/pending representation
        raise HTTPException(status_code=404, detail="Active status not found for this video ID")
        
    return UploadStatusResponse(
        video_id=video_id,
        status=progress["status"],
        progress_pct=progress["progress_pct"],
        current_step=progress["current_step"],
        message=progress.get("message"),
        error_message=progress.get("error_message")
    )
