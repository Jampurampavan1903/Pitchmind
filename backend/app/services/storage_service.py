import os
import shutil
from typing import BinaryIO

class StorageService:
    """Manages file storage actions for videos, frame sequences, and exports, abstracting local vs cloud pathways."""
    
    def __init__(self, base_dir: str = "../storage"):
        self.base_dir = os.path.abspath(base_dir)
        self.videos_dir = os.path.join(self.base_dir, "videos")
        self.frames_dir = os.path.join(self.base_dir, "frames")
        self.exports_dir = os.path.join(self.base_dir, "exports")
        
        # Ensure directories exist
        self._ensure_dir(self.videos_dir)
        self._ensure_dir(self.frames_dir)
        self._ensure_dir(self.exports_dir)

    def _ensure_dir(self, path: str):
        """Creates target directory path if it is missing."""
        os.makedirs(path, exist_ok=True)

    def validate_video(self, filename: str, file_size_bytes: int, max_size_mb: int = 50) -> bool:
        """
        Validates that the uploaded file matches V1 criteria:
        - Must be a supported extension (.mp4, .mov, .avi)
        - Must be under the configured size threshold (default 50MB)
        """
        # Validate Extension
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".mp4", ".mov", ".avi"]:
            raise ValueError(f"Unsupported video format '{ext}'. Must be .mp4, .mov, or .avi")
            
        # Validate Size
        max_bytes = max_size_mb * 1024 * 1024
        if file_size_bytes > max_bytes:
            raise ValueError(f"File size ({file_size_bytes / (1024*1024):.1f}MB) exceeds V1 limit of {max_size_mb}MB")
            
        return True

    def save_video(self, video_id: str, filename: str, file_data: BinaryIO) -> str:
        """
        Saves an uploaded video stream directly to the local filesystem.
        Saves under storage/videos/{video_id}/original.mp4 (preserving extension).
        Returns the absolute filepath.
        """
        ext = os.path.splitext(filename)[1].lower()
        target_dir = os.path.join(self.videos_dir, video_id)
        self._ensure_dir(target_dir)
        
        target_path = os.path.join(target_dir, f"original{ext}")
        
        with open(target_path, "wb") as f:
            shutil.copyfileobj(file_data, f)
            
        return target_path

    def get_video_path(self, video_id: str, extension: str = ".mp4") -> str:
        """Returns filepath for a raw video upload."""
        return os.path.join(self.videos_dir, video_id, f"original{extension}")

    def save_frame(self, video_id: str, frame_index: int, frame_image_bytes: bytes) -> str:
        """
        Saves an extracted frame JPEG inside storage/frames/{video_id}/frame_index.jpg.
        Returns the relative path from base storage to make serving it clean.
        """
        target_dir = os.path.join(self.frames_dir, video_id)
        self._ensure_dir(target_dir)
        
        filename = f"frame_{frame_index:04d}.jpg"
        target_path = os.path.join(target_dir, filename)
        
        with open(target_path, "wb") as f:
            f.write(frame_image_bytes)
            
        # Return relative web path (e.g. "frames/{video_id}/frame_0001.jpg")
        return f"frames/{video_id}/{filename}"

    def get_frame_url(self, relative_path: str) -> str:
        """
        Resolves a relative storage path to a local API asset route.
        For V2, this is easily swapped to S3 presigned URLs.
        """
        return f"/api/v1/assets/{relative_path}"

    def delete_video_assets(self, video_id: str):
        """Cleans up all filesystem folders for a deleted video analysis."""
        video_folder = os.path.join(self.videos_dir, video_id)
        frame_folder = os.path.join(self.frames_dir, video_id)
        
        if os.path.exists(video_folder):
            shutil.rmtree(video_folder)
        if os.path.exists(frame_folder):
            shutil.rmtree(frame_folder)
