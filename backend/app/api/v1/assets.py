"""Authenticated media serving — replaces public StaticFiles mount."""
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.auth import get_auth_user_id
from app.core.database import get_db
from app.core.ownership import (
    get_owned_analysis,
    video_id_from_asset_path,
    analysis_id_from_audio_path,
)
from app.core.security import decode_token_subject
from app.models.video import Video
from app.services.storage_service import StorageService

router = APIRouter()
storage_service = StorageService()


def _resolve_user_id(
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Query(None, alias="token"),
) -> str:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif access_token:
        token = access_token
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = decode_token_subject(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id


async def _authorize_asset_path(
    relative_path: str, user_id: str, db: AsyncSession
) -> str:
    """Return absolute filesystem path if user owns the asset."""
    rel = relative_path.replace("\\", "/").lstrip("/")
    base = storage_service.base_dir
    full = os.path.normpath(os.path.join(base, rel))
    if not full.startswith(base):
        raise HTTPException(status_code=400, detail="Invalid asset path")

    vid = video_id_from_asset_path(rel)
    if vid:
        await _assert_video_owned(db, vid, user_id)
    else:
        aid = analysis_id_from_audio_path(rel)
        if aid:
            await get_owned_analysis(db, aid, user_id)
        else:
            raise HTTPException(status_code=404, detail="Asset not found")

    if not os.path.isfile(full):
        raise HTTPException(status_code=404, detail="Asset file not found")
    return full


async def _assert_video_owned(db: AsyncSession, video_id: str, user_id: str) -> None:
    result = await db.execute(
        select(Video.id).where(
            Video.id == video_id,
            Video.user_id == user_id,
            Video.user_id.isnot(None),
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Asset not found")


@router.get("/assets/{asset_path:path}")
async def serve_asset(
    asset_path: str,
    user_id: str = Depends(_resolve_user_id),
    db: AsyncSession = Depends(get_db),
):
    full_path = await _authorize_asset_path(asset_path, user_id, db)
    return FileResponse(full_path)
