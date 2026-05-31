from dataclasses import dataclass

@dataclass
class Landmark:
    """Represents a single 3D joint coordinate from Pose Estimation."""
    x: float            # X coordinate normalized between 0.0 and 1.0
    y: float            # Y coordinate normalized between 0.0 and 1.0
    z: float            # Depth coordinate normalized relative to the hips
    visibility: float   # Confidence score (probability that the joint is visible)

@dataclass
class FrameLandmarks:
    """Represents the complete tracked skeleton for a single video frame."""
    frame_index: int
    timestamp_ms: float
    landmarks: dict[str, Landmark]   # Keyed by canonical joint name (e.g. "LEFT_ELBOW")
    confidence: float                # Average visibility score of key joints
