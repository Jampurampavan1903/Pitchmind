import uuid
from typing import BinaryIO
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.video import Video
from app.models.analysis import Analysis
from app.services.storage_service import StorageService

class UploadService:
    """Orchestrates player video uploads, file integrity checks, and SQL database registrations."""
    
    def __init__(self, db: AsyncSession, storage_service: StorageService):
        self.db = db
        self.storage = storage_service

    async def handle_upload(self, filename: str, file_data: BinaryIO, file_size_bytes: int) -> Video:
        """
        Validates, saves, and registers an uploaded video.
        Creates matching Video and Analysis database records in a single transaction.
        """
        # 1. Enforce size and type constraints
        self.storage.validate_video(filename, file_size_bytes)
        
        # 2. Scaffolding dynamic IDs
        video_id = str(uuid.uuid4())
        
        # 3. Write binary file to storage bucket
        saved_path = self.storage.save_video(video_id, filename, file_data)
        
        # 4. Create database records
        db_video = Video(
            id=video_id,
            filename=f"original{filename[filename.rfind('.'):]}",
            original_name=filename,
            file_path=saved_path,
            file_size_bytes=file_size_bytes,
            status="uploaded"
        )
        
        db_analysis = Analysis(
            id=str(uuid.uuid4()),
            video_id=video_id,
            status="pending"
        )
        
        self.db.add(db_video)
        self.db.add(db_analysis)
        await self.db.commit()
        await self.db.refresh(db_video)
        
        return db_video
