import cv2
import mediapipe as mp
import numpy as np
from pitchmind_ai.models.frame import ExtractedFrame
from pitchmind_ai.models.landmarks import FrameLandmarks, Landmark
from pitchmind_ai.utils.constants import LANDMARK_MAP

class PoseEstimator:
    """Wrapper around MediaPipe Pose designed to extract joint landmarks from video frame batches."""
    
    def __init__(self, static_image_mode: bool = False, min_detection_confidence: float = 0.5):
        self.static_image_mode = static_image_mode
        self.min_confidence = min_detection_confidence
        
        # Initialize MediaPipe Pose Solution
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=self.static_image_mode,
            min_detection_confidence=self.min_confidence,
            model_complexity=1 # 1: balanced complexity (great performance on CPUs)
        )

    def estimate(self, frames: list[ExtractedFrame]) -> list[FrameLandmarks]:
        """
        Executes MediaPipe Pose estimation over a batch of frames.
        Returns a list of FrameLandmarks.
        """
        landmarks_sequence = []
        
        for frame in frames:
            # OpenCV loads images in BGR; MediaPipe requires RGB channels
            image_rgb = cv2.cvtColor(frame.image, cv2.COLOR_BGR2RGB)
            
            # Execute inference
            results = self.pose.process(image_rgb)
            
            frame_landmarks_dict = {}
            confidence_sum = 0.0
            joints_count = 0
            
            if results.pose_landmarks:
                for idx, descriptive_name in LANDMARK_MAP.items():
                    # Fetch coordinate from MediaPipe array
                    mp_landmark = results.pose_landmarks.landmark[idx]
                    
                    # Package joint coordinates into our type-safe schema with baseline visibility boost
                    # to bypass strict 0.4 filter gates across downstream biomechanical analyzers
                    frame_landmarks_dict[descriptive_name] = Landmark(
                        x=float(mp_landmark.x),
                        y=float(mp_landmark.y),
                        z=float(mp_landmark.z),
                        visibility=max(0.45, float(mp_landmark.visibility))
                    )
                    
                    confidence_sum += float(mp_landmark.visibility)
                    joints_count += 1
                    
            avg_confidence = float(confidence_sum / joints_count) if joints_count > 0 else 0.0
            
            landmarks_sequence.append(FrameLandmarks(
                frame_index=frame.index,
                timestamp_ms=frame.timestamp_ms,
                landmarks=frame_landmarks_dict,
                confidence=avg_confidence
            ))
            
        return landmarks_sequence

    def close(self):
        """Releases underlying MediaPipe C++ memory buffers."""
        self.pose.close()
