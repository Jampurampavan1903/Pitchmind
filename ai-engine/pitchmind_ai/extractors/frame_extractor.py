import cv2
import os
import numpy as np
from pitchmind_ai.models.frame import ExtractedFrame

class FrameExtractor:
    """Handles high-performance video loading and downsampled frame extraction using OpenCV."""
    
    @staticmethod
    def get_video_metadata(video_path: str) -> dict:
        """
        Extracts telemetry information from the video header without decoding frames.
        Returns dict containing: fps, frame_count, resolution (WxH), and duration.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"OpenCV could not open video stream for file: {video_path}")
            
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        cap.release()
        
        # Guard against zero-division in corrupt files
        duration = float(frame_count / fps) if fps > 0 else 0.0
        
        return {
            "fps": fps,
            "frame_count": frame_count,
            "resolution": f"{width}x{height}",
            "duration": duration
        }

    def extract(self, video_path: str, sample_rate: int = 5, max_frames: int = 300) -> list[ExtractedFrame]:
        """
        Extracts frames sequentially from the video, downsampling at the configured sample_rate.
        - sample_rate = 5 means every 5th frame is extracted.
        - max_frames = 300 caps the output list to protect memory limits.
        """
        metadata = self.get_video_metadata(video_path)
        fps = metadata["fps"]
        
        cap = cv2.VideoCapture(video_path)
        extracted_frames = []
        frame_idx = 0
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # Downsample checks
                if frame_idx % sample_rate == 0:
                    # Calculate accurate timestamp in milliseconds
                    timestamp_ms = (frame_idx / fps) * 1000.0 if fps > 0 else 0.0
                    
                    extracted_frames.append(ExtractedFrame(
                        image=frame.copy(),
                        index=len(extracted_frames),
                        timestamp_ms=timestamp_ms,
                        source_fps=fps
                    ))
                    
                    # Stop extraction if max frames limit reached
                    if len(extracted_frames) >= max_frames:
                        break
                        
                frame_idx += 1
        finally:
            cap.release()
            
        return extracted_frames
