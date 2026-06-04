import os
import urllib.request
import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode

from pitchmind_ai.models.frame import ExtractedFrame
from pitchmind_ai.models.landmarks import FrameLandmarks, Landmark
from pitchmind_ai.utils.constants import LANDMARK_MAP

_POSE_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
)
_MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
_MODEL_CACHE_PATH = os.path.join(_MODEL_CACHE_DIR, "pose_landmarker_lite.task")


def _ensure_pose_model() -> str:
    """Download pose landmarker task bundle once into package cache."""
    if os.path.isfile(_MODEL_CACHE_PATH):
        return _MODEL_CACHE_PATH
    os.makedirs(_MODEL_CACHE_DIR, exist_ok=True)
    urllib.request.urlretrieve(_POSE_MODEL_URL, _MODEL_CACHE_PATH)
    return _MODEL_CACHE_PATH


class PoseEstimator:
    """MediaPipe PoseLandmarker (Tasks API) — runs CPU-only without OpenGL."""

    def __init__(self, static_image_mode: bool = False, min_detection_confidence: float = 0.5):
        self.static_image_mode = static_image_mode
        self.min_confidence = min_detection_confidence
        model_path = _ensure_pose_model()
        options = PoseLandmarkerOptions(
            base_options=BaseOptions(
                model_asset_path=model_path,
                delegate=BaseOptions.Delegate.CPU,
            ),
            running_mode=RunningMode.IMAGE,
            min_pose_detection_confidence=min_detection_confidence,
            min_pose_presence_confidence=min_detection_confidence,
            min_tracking_confidence=min_detection_confidence,
            num_poses=1,
        )
        self.landmarker = PoseLandmarker.create_from_options(options)

    def estimate(self, frames: list[ExtractedFrame]) -> list[FrameLandmarks]:
        landmarks_sequence = []

        for frame in frames:
            image_rgb = cv2.cvtColor(frame.image, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
            result = self.landmarker.detect(mp_image)

            frame_landmarks_dict = {}
            confidence_sum = 0.0
            joints_count = 0

            if result.pose_landmarks:
                pose_landmarks = result.pose_landmarks[0]
                for idx, descriptive_name in LANDMARK_MAP.items():
                    if idx >= len(pose_landmarks):
                        continue
                    lm = pose_landmarks[idx]
                    visibility = float(getattr(lm, "visibility", 1.0) or 1.0)
                    frame_landmarks_dict[descriptive_name] = Landmark(
                        x=float(lm.x),
                        y=float(lm.y),
                        z=float(lm.z),
                        visibility=max(0.45, visibility),
                    )
                    confidence_sum += visibility
                    joints_count += 1

            avg_confidence = float(confidence_sum / joints_count) if joints_count > 0 else 0.0
            landmarks_sequence.append(
                FrameLandmarks(
                    frame_index=frame.index,
                    timestamp_ms=frame.timestamp_ms,
                    landmarks=frame_landmarks_dict,
                    confidence=avg_confidence,
                )
            )

        return landmarks_sequence

    def close(self):
        if hasattr(self, "landmarker") and self.landmarker is not None:
            self.landmarker.close()
            self.landmarker = None
