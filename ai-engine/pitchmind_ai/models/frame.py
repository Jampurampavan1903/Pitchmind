from dataclasses import dataclass
import numpy as np

@dataclass
class ExtractedFrame:
    """Represents a single frame extracted from a raw video."""
    image: np.ndarray        # Frame image array decoded by OpenCV
    index: int               # Original frame index in the source video
    timestamp_ms: float      # Timestamp in milliseconds from the start
    source_fps: float        # Frame rate of the source video
