import json
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
import os
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.services.analysis_service import AnalysisService
from app.schemas.analysis import AnalysisResponse, FrameResponse
from app.services.storage_service import StorageService

router = APIRouter()
storage_service = StorageService()

@router.get("/analyses", response_model=List[AnalysisResponse])
async def list_analyses(db: AsyncSession = Depends(get_db)):
    """Retrieves a list of recent batting evaluations for the player history timeline."""
    service = AnalysisService(db)
    analyses = await service.list_recent_analyses()
    
    response = []
    for a in analyses:
        # Unpack SQL JSON strings back to structured Pydantic parameters
        metrics = json.loads(a.metrics_json) if a.metrics_json else None
        coaching = json.loads(a.coaching_json) if a.coaching_json else None
        
        # 🆕 Unpack deliveries or fall back to single delivery
        deliveries = None
        has_deliveries_json = hasattr(a, 'deliveries_json') and a.deliveries_json
        if has_deliveries_json:
            deliveries = json.loads(a.deliveries_json)
        elif metrics:
            deliveries = [{
                "delivery_index": 0,
                "frame_range": [0, a.frame_count - 1],
                "metrics": metrics,
                "coaching": coaching or []
            }]
            
        delivery_count = len(deliveries) if deliveries else 1
        
        response.append(AnalysisResponse(
            id=a.id,
            video_id=a.video_id,
            status=a.status,
            metrics=metrics,
            coaching=coaching,
            deliveries=deliveries,
            delivery_count=delivery_count,
            frame_count=a.frame_count,
            processing_time_seconds=a.processing_time_seconds,
            error_message=a.error_message,
            created_at=a.created_at,
            completed_at=a.completed_at
        ))
    return response

@router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves complete joint landmarks, metrics, and coaching insights for a single drive shot."""
    service = AnalysisService(db)
    a = await service.get_analysis(analysis_id)
    if not a:
        a = await service.get_analysis_by_video(analysis_id)
    if not a:
        raise HTTPException(status_code=404, detail="Analysis report not found")
        
    metrics = json.loads(a.metrics_json) if a.metrics_json else None
    coaching = json.loads(a.coaching_json) if a.coaching_json else None
    landmarks = json.loads(a.landmarks_json) if a.landmarks_json else None
    
    # 🆕 Unpack deliveries or fall back to single delivery
    deliveries = None
    has_deliveries_json = hasattr(a, 'deliveries_json') and a.deliveries_json
    if has_deliveries_json:
        deliveries = json.loads(a.deliveries_json)
    elif metrics:
        deliveries = [{
            "delivery_index": 0,
            "frame_range": [0, a.frame_count - 1],
            "metrics": metrics,
            "coaching": coaching or []
        }]
        
    delivery_count = len(deliveries) if deliveries else 1
    
    return AnalysisResponse(
        id=a.id,
        video_id=a.video_id,
        status=a.status,
        metrics=metrics,
        coaching=coaching,
        landmarks=landmarks,
        deliveries=deliveries,
        delivery_count=delivery_count,
        frame_count=a.frame_count,
        processing_time_seconds=a.processing_time_seconds,
        error_message=a.error_message,
        created_at=a.created_at,
        completed_at=a.completed_at
    )

@router.get("/analysis/{analysis_id}/frames", response_model=List[FrameResponse])
async def get_analysis_frames(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns an index list of JPEGs frames for canvas pose skeleton overlay renderings.
    Resolves relative paths to local API static URLs.
    """
    service = AnalysisService(db)
    a = await service.get_analysis(analysis_id)
    if not a:
        a = await service.get_analysis_by_video(analysis_id)
    if not a:
        raise HTTPException(status_code=404, detail="Analysis report not found")
        
    # Unpack landmarks to extract time offsets and sequence sizes
    landmarks_list = json.loads(a.landmarks_json) if a.landmarks_json else []
    
    frames_response = []
    for l in landmarks_list:
        frame_idx = l["frame_index"]
        timestamp = l["timestamp_ms"]
        
        # Build standard URL to load frame
        relative_path = f"frames/{a.video_id}/frame_{frame_idx:04d}.jpg"
        url = storage_service.get_frame_url(relative_path)
        
        frames_response.append(FrameResponse(
            index=frame_idx,
            timestamp_ms=timestamp,
            image_url=url
        ))
        
    return frames_response

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Deletes a batting evaluation session, its SQLite database records, and all raw/frame video files."""
    service = AnalysisService(db)
    
    # 1. Fetch analysis to find the associated video_id
    a = await service.get_analysis(analysis_id)
    if not a:
        a = await service.get_analysis_by_video(analysis_id)
    if not a:
        raise HTTPException(status_code=404, detail="Analysis report not found")
        
    video_id = a.video_id
    
    # 2. Delete database records using the service
    await service.delete_analysis_record(a.id, video_id)
        
    # 3. Clean up physical video and frame files on the filesystem
    try:
        storage_service.delete_video_assets(video_id)
    except Exception as e:
        # Log error, but proceed since DB is clean
        print(f"Filesystem cleanup failed for video_id {video_id}: {str(e)}")
        
    return {"message": "Session deleted successfully"}

@router.post("/analysis/{analysis_id}/audio")
async def upload_audio(analysis_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Uploads a WebM/audio coaching voice-over, saving it to disk and updating the DB coaching flag."""
    audio_dir = os.path.abspath("../storage/audio")
    os.makedirs(audio_dir, exist_ok=True)
    
    target_path = os.path.join(audio_dir, f"{analysis_id}.webm")
    
    with open(target_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    service = AnalysisService(db)
    a = await service.get_analysis(analysis_id)
    if a:
        coaching = json.loads(a.coaching_json) if a.coaching_json else {}
        if isinstance(coaching, dict):
            coaching["has_audio"] = True
            a.coaching_json = json.dumps(coaching)
            await db.commit()
            
    return {"message": "Audio voice-over saved successfully", "url": f"/api/v1/assets/audio/{analysis_id}.webm"}
