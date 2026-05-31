from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UploadResponse(BaseModel):
    """Payload returned immediately after successful video upload receipt."""
    video_id: str
    filename: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class UploadStatusResponse(BaseModel):
    """Detailed progress metrics returned during active background processing."""
    video_id: str
    status: str          # 'uploaded', 'processing', 'complete', 'failed'
    progress_pct: float
    current_step: str    # 'extracting_frames', 'pose_estimation', etc.
    message: Optional[str] = None
    error_message: Optional[str] = None
