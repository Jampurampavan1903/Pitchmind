"""Tenant isolation helpers: resolve videos/analyses for the authenticated user only."""
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.analysis import Analysis
from app.models.video import Video


async def get_owned_video(
    db: AsyncSession, video_id: str, user_id: str
) -> Video:
    result = await db.execute(
        select(Video).where(
            Video.id == video_id,
            Video.user_id == user_id,
            Video.user_id.isnot(None),
        )
    )
    video = result.scalars().first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    return video


async def get_owned_analysis(
    db: AsyncSession, analysis_id: str, user_id: str
) -> Tuple[Analysis, Video]:
    """Resolve by analysis id or video id (legacy URLs); enforce video ownership."""
    result = await db.execute(
        select(Analysis)
        .where(Analysis.id == analysis_id)
        .options(selectinload(Analysis.video))
    )
    analysis = result.scalars().first()
    if not analysis:
        result = await db.execute(
            select(Analysis)
            .where(Analysis.video_id == analysis_id)
            .options(selectinload(Analysis.video))
        )
        analysis = result.scalars().first()
    if not analysis or not analysis.video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis report not found",
        )
    owner_id = analysis.video.user_id
    if not owner_id or owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis report not found",
        )
    return analysis, analysis.video


def video_id_from_asset_path(relative_path: str) -> Optional[str]:
    """Extract video_id from paths like videos/{id}/original.mp4 or frames/{id}/frame_0001.jpg."""
    parts = relative_path.replace("\\", "/").strip("/").split("/")
    if len(parts) >= 2 and parts[0] in ("videos", "frames"):
        return parts[1]
    return None


def analysis_id_from_audio_path(relative_path: str) -> Optional[str]:
    parts = relative_path.replace("\\", "/").strip("/").split("/")
    if len(parts) >= 2 and parts[0] == "audio":
        name = parts[1]
        if name.endswith(".webm"):
            return name[: -len(".webm")]
    return None
