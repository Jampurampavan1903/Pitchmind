import os
import shutil
import urllib.request
import urllib.error
from typing import BinaryIO

class StorageService:
    """Manages file storage actions for videos, frame sequences, and exports, abstracting local vs Supabase cloud pathways."""
    
    def __init__(self, base_dir: str = "../storage"):
        self.base_dir = os.path.abspath(base_dir)
        self.videos_dir = os.path.join(self.base_dir, "videos")
        self.frames_dir = os.path.join(self.base_dir, "frames")
        self.exports_dir = os.path.join(self.base_dir, "exports")
        
        # Ensure caching directories exist
        os.makedirs(self.videos_dir, exist_ok=True)
        os.makedirs(self.frames_dir, exist_ok=True)
        os.makedirs(self.exports_dir, exist_ok=True)
        
        # Load Supabase settings dynamically from environment variables
        self.supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        self.supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        self.bucket_name = "pitchmind-media"
        
        self.is_cloud = bool(self.supabase_url and self.supabase_key)

    def validate_video(self, filename: str, file_size_bytes: int, max_size_mb: int = 50) -> bool:
        """
        Validates that the uploaded file matches V1 criteria:
        - Must be a supported extension (.mp4, .mov, .avi)
        - Must be under the configured size threshold (default 50MB)
        """
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".mp4", ".mov", ".avi"]:
            raise ValueError(f"Unsupported video format '{ext}'. Must be .mp4, .mov, or .avi")
            
        max_bytes = max_size_mb * 1024 * 1024
        if file_size_bytes > max_bytes:
            raise ValueError(f"File size ({file_size_bytes / (1024*1024):.1f}MB) exceeds V1 limit of {max_size_mb}MB")
            
        return True

    def save_video(self, video_id: str, filename: str, file_data: BinaryIO) -> str:
        """
        Saves an uploaded video stream locally (required for CV2 analysis pipelines)
        and uploads it permanently to the Supabase Cloud Storage bucket if configured.
        """
        ext = os.path.splitext(filename)[1].lower()
        target_dir = os.path.join(self.videos_dir, video_id)
        os.makedirs(target_dir, exist_ok=True)
        
        target_path = os.path.join(target_dir, f"original{ext}")
        
        # 1. Save locally for CV2 rendering pipeline
        file_data.seek(0)
        with open(target_path, "wb") as f:
            shutil.copyfileobj(file_data, f)
            
        # 2. Upload to Supabase Storage if configured
        if self.is_cloud:
            try:
                with open(target_path, "rb") as f:
                    binary_content = f.read()
                
                cloud_path = f"videos/{video_id}/original{ext}"
                upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{cloud_path}"
                
                req = urllib.request.Request(
                    upload_url,
                    data=binary_content,
                    headers={
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": f"video/{ext[1:]}",
                        "x-upsert": "true"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req) as _:
                    pass
            except Exception as e:
                # Log warning and fail gracefully to ensure local pipeline doesn't break
                print(f"[Supabase Storage] Video upload warning: {e}")
                
        return target_path

    def get_video_path(self, video_id: str, extension: str = ".mp4") -> str:
        """Returns filepath for a raw video upload."""
        return os.path.join(self.videos_dir, video_id, f"original{extension}")

    def save_frame(self, video_id: str, frame_index: int, frame_image_bytes: bytes) -> str:
        """
        Saves an extracted frame JPEG inside local cache
        and pushes it to Supabase public storage bucket permanently.
        """
        target_dir = os.path.join(self.frames_dir, video_id)
        os.makedirs(target_dir, exist_ok=True)
        
        filename = f"frame_{frame_index:04d}.jpg"
        target_path = os.path.join(target_dir, filename)
        
        # 1. Cache locally
        with open(target_path, "wb") as f:
            f.write(frame_image_bytes)
            
        # 2. Sync to Supabase Storage
        if self.is_cloud:
            try:
                cloud_path = f"frames/{video_id}/{filename}"
                upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{cloud_path}"
                
                req = urllib.request.Request(
                    upload_url,
                    data=frame_image_bytes,
                    headers={
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": "image/jpeg",
                        "x-upsert": "true"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req) as _:
                    pass
                return f"frames/{video_id}/{filename}"
            except Exception as e:
                print(f"[Supabase Storage] Frame upload warning: {e}")
                
        return f"frames/{video_id}/{filename}"

    def get_frame_url(self, relative_path: str) -> str:
        """
        Resolves a relative storage path to a Supabase public direct CDN URL,
        fully bypassing backend serving, or falls back to local assets route.
        """
        if self.is_cloud:
            return f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{relative_path}"
        return f"/api/v1/assets/{relative_path}"

    def delete_video_assets(self, video_id: str):
        """Cleans up all filesystem folders for a deleted video analysis."""
        video_folder = os.path.join(self.videos_dir, video_id)
        frame_folder = os.path.join(self.frames_dir, video_id)
        
        if os.path.exists(video_folder):
            shutil.rmtree(video_folder)
        if os.path.exists(frame_folder):
            shutil.rmtree(frame_folder)
