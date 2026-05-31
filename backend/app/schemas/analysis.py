from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, Dict, List, Union

class LandmarkSchema(BaseModel):
    """Pydantic representation of a single joint coordinate."""
    x: float
    y: float
    z: float
    visibility: float

class FrameLandmarksSchema(BaseModel):
    """Pose tracking coordinates for a single frame."""
    frame_index: int
    timestamp_ms: float
    landmarks: Dict[str, LandmarkSchema]
    confidence: float

class ElbowMetricsSchema(BaseModel):
    max_backswing_angle: float
    min_impact_angle: float
    follow_through_angle: float
    stability_score: float
    is_dropped_elbow: bool

class HeadMetricsSchema(BaseModel):
    movement_std_dev_px: float
    eye_level_tilt_degrees: float
    stability_score: float

class StanceMetricsSchema(BaseModel):
    width_to_shoulder_ratio: float
    balance_score: float

class FootworkMetricsSchema(BaseModel):
    stride_length_px: float
    timing_delay_ms: float
    stride_ratio: Optional[float] = None
    alignment_angle: Optional[float] = None
    weight_transfer_pct: Optional[float] = None
    is_step_across: Optional[bool] = None

class HipShoulderMetricsSchema(BaseModel):
    peak_separation_degrees: float
    separation_at_impact: float
    power_score: float

class KneeMetricsSchema(BaseModel):
    angle_at_impact: float
    min_angle: float
    is_collapsed: bool
    brace_score: float

class WristMetricsSchema(BaseModel):
    roll_direction: str
    max_roll_delta: float
    roll_timing_pct: float
    control_score: float

class CentreOfMassMetricsSchema(BaseModel):
    max_lateral_sway: float
    avg_lateral_sway: float
    sway_corridor_px: float
    balance_score: float

class BackliftMetricsSchema(BaseModel):
    peak_height_ratio: float
    loop_deviation: float
    is_loopy: bool
    backlift_score: float

class TimingMetricsSchema(BaseModel):
    timing_delta_ms: float
    rating: str
    score: float

class ContactMetricsSchema(BaseModel):
    contact_zone: str
    lateral_deviation_cm: float
    height_deviation_cm: float
    accuracy_score: float

class TacticalAlternativeSchema(BaseModel):
    shot_name: str
    risk_rating: int
    tactical_purpose: str

class LengthJudgingSchema(BaseModel):
    ball_length_category: str
    judging_rating: str
    judging_score: float
    pitching_distance_meters: Optional[float] = None
    flaw_detected: Optional[str] = None

class KineticSegmentTimingSchema(BaseModel):
    segment_name: str
    peak_velocity: float
    peak_timestamp_ms: float
    sequence_rank: int

class KineticChainSchema(BaseModel):
    sequence_score: float
    is_out_of_order: bool
    power_leaks: List[str]
    segments: List[KineticSegmentTimingSchema]

class BattingMetricsSchema(BaseModel):
    elbow: ElbowMetricsSchema
    head: HeadMetricsSchema
    stance: StanceMetricsSchema
    footwork: FootworkMetricsSchema
    hip_shoulder: Optional[HipShoulderMetricsSchema] = None
    knee: Optional[KneeMetricsSchema] = None
    wrist: Optional[WristMetricsSchema] = None
    centre_of_mass: Optional[CentreOfMassMetricsSchema] = None
    backlift: Optional[BackliftMetricsSchema] = None
    
    # PitchMind V1.2 Schemas
    timing: Optional[TimingMetricsSchema] = None
    contact: Optional[ContactMetricsSchema] = None
    tactical_alternatives: Optional[List[TacticalAlternativeSchema]] = None
    length_judging: Optional[LengthJudgingSchema] = None
    kinetic_chain: Optional[KineticChainSchema] = None # 🆕 V0.4 Kinematic Sequence
    
    overall_score: float
    stroke_type: str = "cover_drive"
    stroke_name: str = "Front-Foot Cover Drive"


class CoachingInsightSchema(BaseModel):
    category: str
    severity: str
    title: str
    message: str
    recommendation: str

class AnalysisMetadataSchema(BaseModel):
    fps: float
    frame_count: int
    resolution: str
    processing_time_seconds: float
    created_at: datetime

class DeliveryResultSchema(BaseModel):
    """Pydantic representation of a single delivery analysis."""
    delivery_index: int
    frame_range: List[int] # [start_frame, end_frame]
    metrics: BattingMetricsSchema
    coaching: Optional[Union[List[CoachingInsightSchema], Dict[str, Any]]] = None
    landmarks: Optional[List[FrameLandmarksSchema]] = None

class AnalysisResponse(BaseModel):
    """Complete technical biomechanical report returned to the client dashboard."""
    id: str
    video_id: str
    status: str
    metrics: Optional[BattingMetricsSchema] = None
    coaching: Optional[Union[List[CoachingInsightSchema], Dict[str, Any]]] = None
    landmarks: Optional[List[FrameLandmarksSchema]] = None
    deliveries: Optional[List[DeliveryResultSchema]] = None # 🆕 Multi-delivery results
    delivery_count: int = 1 # 🆕 Total delivery count
    frame_count: int
    processing_time_seconds: Optional[float] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FrameResponse(BaseModel):
    """Represents a single frame image served to the front-end skeleton canvas."""
    index: int
    timestamp_ms: float
    image_url: str
