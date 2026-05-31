from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.models.analysis import Analysis
from app.models.video import Video

class AnalysisService:
    """Manages database CRUD actions for biomechanical reports and processing states."""
    
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_analysis(self, analysis_id: str) -> Optional[Analysis]:
        """Fetches a detailed analysis report using its unique ID."""
        result = await self.db.execute(
            select(Analysis).where(Analysis.id == analysis_id)
        )
        return result.scalars().first()

    async def get_analysis_by_video(self, video_id: str) -> Optional[Analysis]:
        """Fetches an analysis report matching a specific video ID."""
        result = await self.db.execute(
            select(Analysis).where(Analysis.video_id == video_id)
        )
        return result.scalars().first()

    async def list_recent_analyses(self, limit: int = 10) -> List[Analysis]:
        """Fetches a sorted list of the most recent technique evaluations."""
        result = await self.db.execute(
            select(Analysis).order_by(Analysis.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def update_status(self, analysis_id: str, status: str, error_message: Optional[str] = None):
        """Updates the active analysis processing status (e.g. processing, complete)."""
        analysis = await self.get_analysis(analysis_id)
        if analysis:
            analysis.status = status
            if error_message:
                analysis.error_message = error_message
            await self.db.commit()

    async def delete_analysis_record(self, analysis_id: str, video_id: str) -> bool:
        """Deletes both analysis and associated original video records from SQLite database."""
        analysis = await self.get_analysis(analysis_id)
        if analysis:
            await self.db.delete(analysis)
            
        result = await self.db.execute(
            select(Video).where(Video.id == video_id)
        )
        video = result.scalars().first()
        if video:
            await self.db.delete(video)
            
        await self.db.commit()
        return True
