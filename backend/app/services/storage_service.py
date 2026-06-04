import os
import shutil
import urllib.request
from typing import BinaryIO

from app.core.logging import get_logger
from app.core.storage_paths import resolve_storage_base_dir

logger = get_logger("pitchmind.storage")


class StorageService:
    """Manages file storage actions for videos, frame sequences, and exports, abstracting local vs Supabase cloud pathways."""

    def __init__(self, base_dir: str | None = None):
        self.base_dir = os.path.abspath(base_dir or resolve_storage_base_dir())
        self.videos_dir = os.path.join(self.base_dir, "videos")
        self.frames_dir = os.path.join(self.base_dir, "frames")
        self.exports_dir = os.path.join(self.base_dir, "exports")

        os.makedirs(self.videos_dir, exist_ok=True)
        os.makedirs(self.frames_dir, exist_ok=True)
        os.makedirs(self.exports_dir, exist_ok=True)

        self.supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        self.supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        self.bucket_name = "pitchmind-media"
        self.is_cloud = bool(self.supabase_url and self.supabase_key)

        logger.info("StorageService initialized base_dir=%s", self.base_dir)

    def validate_video(self, filename: str, file_size_bytes: int, max_size_mb: int = 50) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".mp4", ".mov", ".avi"]:
            raise ValueError(f"Unsupported video format '{ext}'. Must be .mp4, .mov, or .avi")

        max_bytes = max_size_mb * 1024 * 1024
        if file_size_bytes > max_bytes:
            raise ValueError(
                f"File size ({file_size_bytes / (1024*1024):.1f}MB) exceeds V1 limit of {max_size_mb}MB"
            )
        if file_size_bytes <= 0:
            raise ValueError("Empty upload — file size must be greater than zero")

        min_bytes = 10_000  # reject placeholder/tiny files that break OpenCV
        if file_size_bytes < min_bytes:
            raise ValueError(
                f"Video too small ({file_size_bytes} bytes). "
                f"Minimum {min_bytes} bytes required for analysis."
            )

        return True

    def save_video(self, video_id: str, filename: str, file_data: BinaryIO) -> str:
        ext = os.path.splitext(filename)[1].lower()
        target_dir = os.path.join(self.videos_dir, video_id)
        os.makedirs(target_dir, exist_ok=True)

        target_path = os.path.join(target_dir, f"original{ext}")
        logger.info(
            "save_video start video_id=%s target_path=%s",
            video_id,
            target_path,
        )

        file_data.seek(0)
        with open(target_path, "wb") as f:
            shutil.copyfileobj(file_data, f)
            f.flush()
            os.fsync(f.fileno())

        written = os.path.getsize(target_path)
        exists = os.path.isfile(target_path)
        logger.info(
            "save_video done video_id=%s path=%s exists=%s size_bytes=%d",
            video_id,
            target_path,
            exists,
            written,
        )
        min_bytes = 10_000
        if not exists or written <= 0:
            raise OSError(
                f"Video write failed: path={target_path} exists={exists} size_bytes={written}"
            )
        if written < min_bytes:
            raise OSError(
                f"Video write too small: path={target_path} size_bytes={written} "
                f"minimum={min_bytes}"
            )

        if self.is_cloud:
            try:
                with open(target_path, "rb") as f:
                    binary_content = f.read()

                cloud_path = f"videos/{video_id}/original{ext}"
                upload_url = (
                    f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{cloud_path}"
                )

                req = urllib.request.Request(
                    upload_url,
                    data=binary_content,
                    headers={
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": f"video/{ext[1:]}",
                        "x-upsert": "true",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req) as _:
                    pass
            except Exception as e:
                logger.warning("Supabase video upload skipped: %s", e)

        return target_path

    def resolve_video_read_path(self, video_id: str, stored_path: str | None) -> str:
        """
        Path used by analysis worker — prefer DB path if present on disk,
        else reconstruct under canonical videos_dir.
        """
        if stored_path:
            stored_abs = os.path.abspath(stored_path)
            if os.path.isfile(stored_abs) and os.path.getsize(stored_abs) > 0:
                logger.info(
                    "resolve_video_read_path video_id=%s using stored_path=%s size=%d",
                    video_id,
                    stored_abs,
                    os.path.getsize(stored_abs),
                )
                return stored_abs

        for ext in (".mp4", ".mov", ".avi"):
            candidate = self.get_video_path(video_id, ext)
            if os.path.isfile(candidate) and os.path.getsize(candidate) > 0:
                logger.info(
                    "resolve_video_read_path video_id=%s using candidate=%s size=%d",
                    video_id,
                    candidate,
                    os.path.getsize(candidate),
                )
                return candidate

        fallback = self.get_video_path(video_id, ".mp4")
        logger.error(
            "resolve_video_read_path video_id=%s stored_path=%s base_dir=%s fallback=%s",
            video_id,
            stored_path,
            self.base_dir,
            fallback,
        )
        return fallback

    def get_video_path(self, video_id: str, extension: str = ".mp4") -> str:
        return os.path.join(self.videos_dir, video_id, f"original{extension}")

    def save_frame(self, video_id: str, frame_index: int, frame_image_bytes: bytes) -> str:
        target_dir = os.path.join(self.frames_dir, video_id)
        os.makedirs(target_dir, exist_ok=True)

        filename = f"frame_{frame_index:04d}.jpg"
        target_path = os.path.join(target_dir, filename)

        with open(target_path, "wb") as f:
            f.write(frame_image_bytes)

        if self.is_cloud:
            try:
                cloud_path = f"frames/{video_id}/{filename}"
                upload_url = (
                    f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{cloud_path}"
                )

                req = urllib.request.Request(
                    upload_url,
                    data=frame_image_bytes,
                    headers={
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": "image/jpeg",
                        "x-upsert": "true",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req) as _:
                    pass
                return f"frames/{video_id}/{filename}"
            except Exception as e:
                logger.warning("Supabase frame upload skipped: %s", e)

        return f"frames/{video_id}/{filename}"

    def get_frame_url(self, relative_path: str) -> str:
        rel = relative_path.replace("\\", "/").lstrip("/")
        return f"/api/v1/assets/{rel}"

    def delete_video_assets(self, video_id: str):
        video_folder = os.path.join(self.videos_dir, video_id)
        frame_folder = os.path.join(self.frames_dir, video_id)

        if os.path.exists(video_folder):
            shutil.rmtree(video_folder)
        if os.path.exists(frame_folder):
            shutil.rmtree(frame_folder)
