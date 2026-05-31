from dataclasses import dataclass
from datetime import datetime
from pitchmind_ai.models.frame import ExtractedFrame
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import BattingMetrics

@dataclass
class CoachingInsight:
    """A natural language coaching review generated for a technique flaw."""
    category: str              # e.g., "elbow", "head", "footwork"
    severity: str              # "info" | "warning" | "critical"
    title: str                 # Short punchy technique alert
    message: str               # Technical explanation of the fault
    recommendation: str        # Actionable coaching drill/fix

@dataclass
class AnalysisMetadata:
    """Telemetry information relating to the processing pipeline execution."""
    fps: float
    frame_count: int
    resolution: str
    processing_time_seconds: float
    created_at: datetime

@dataclass
class DeliveryResult:
    """Analysis results for a single delivery within a netting session."""
    delivery_index: int           # 0-based index
    frame_range: tuple[int, int]  # (start_frame, end_frame) indices in the full frames list
    frames: list[ExtractedFrame]
    landmarks: list[FrameLandmarks]
    metrics: BattingMetrics
    coaching: list[CoachingInsight]

@dataclass
class BattingAnalysisResult:
    """The absolute, type-safe output payload of the PitchMind AI pipeline."""
    video_id: str
    frames: list[ExtractedFrame]
    landmarks: list[FrameLandmarks]
    metrics: BattingMetrics
    coaching: list[CoachingInsight]
    metadata: AnalysisMetadata
    deliveries: list[DeliveryResult] = None

