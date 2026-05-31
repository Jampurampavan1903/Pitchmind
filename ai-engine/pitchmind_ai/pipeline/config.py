from dataclasses import dataclass
from typing import Optional

@dataclass
class PipelineConfig:
    """Configuration class for the cricket batting analysis pipeline."""
    frame_sample_rate: int = 5
    confidence_threshold: float = 0.5
    max_frames: int = 300
    enable_coaching: bool = True
    gemini_api_key: Optional[str] = None
