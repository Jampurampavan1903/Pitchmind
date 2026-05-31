from dataclasses import dataclass
from typing import Optional, List

@dataclass
class ElbowMetrics:
    """Lead elbow angle metrics evaluated across the batting stroke."""
    max_backswing_angle: float   # Max elbow extension at the peak of backswing (degrees)
    min_impact_angle: float      # Elbow flexion at the moment of ball impact
    follow_through_angle: float  # Elbow extension during follow-through
    stability_score: float       # Normalized score (0-100) representing vertical alignment
    is_dropped_elbow: bool       # Technique flaw flag (True if elbow drops too early)

@dataclass
class HeadMetrics:
    """Head stability metrics across the batting stroke."""
    movement_std_dev_px: float   # Deviation in pixels across frames
    eye_level_tilt_degrees: float # Maximum head tilt
    stability_score: float       # Normalized score (0-100)

@dataclass
class StanceMetrics:
    """Stance balance metrics."""
    width_to_shoulder_ratio: float
    balance_score: float

@dataclass
class FootworkMetrics:
    """Footwork stride metrics."""
    stride_length_px: float
    timing_delay_ms: float
    stride_ratio: float
    alignment_angle: float
    weight_transfer_pct: float
    is_step_across: bool

@dataclass
class HipShoulderMetrics:
    """Hip-shoulder separation (X-Factor) metrics."""
    peak_separation_degrees: float
    separation_at_impact: float
    power_score: float

@dataclass
class KneeMetrics:
    """Front knee brace/flexion metrics at impact."""
    angle_at_impact: float
    min_angle: float
    is_collapsed: bool
    brace_score: float

@dataclass
class WristMetrics:
    """Wrist roll control (supination/pronation) metrics."""
    roll_direction: str
    max_roll_delta: float
    roll_timing_pct: float
    control_score: float

@dataclass
class CentreOfMassMetrics:
    """Centre of mass balance and lateral stability metrics."""
    max_lateral_sway: float
    avg_lateral_sway: float
    sway_corridor_px: float
    balance_score: float

@dataclass
class BackliftMetrics:
    """Backlift path, height, and loop metrics."""
    peak_height_ratio: float
    loop_deviation: float
    is_loopy: bool
    backlift_score: float

@dataclass
class TimingMetrics:
    """Timing metrics evaluating the sync between swing velocity and ball arrival."""
    timing_delta_ms: float
    rating: str          # 'optimal', 'early', 'late'
    score: float

@dataclass
class ContactMetrics:
    """Evaluates impact location on the bat face (sweet spot vs edge)."""
    contact_zone: str    # 'sweet_spot', 'outer_edge', 'inner_edge', 'toe', 'splice'
    lateral_deviation_cm: float
    height_deviation_cm: float
    accuracy_score: float

@dataclass
class TacticalAlternative:
    """An alternative shot the batsman could have played for this delivery."""
    shot_name: str
    risk_rating: int     # 0-10
    tactical_purpose: str

@dataclass
class LengthJudging:
    """Evaluates the player's length judging and committal choice."""
    ball_length_category: str # 'short', 'good', 'slot', 'yorker'
    judging_rating: str        # 'perfect_committal', 'hesitant', 'misjudged'
    judging_score: float
    pitching_distance_meters: float = 4.5
    flaw_detected: Optional[str] = None

@dataclass
class KineticSegmentTiming:
    """Represents velocity and timing telemetry for a single kinetic segment."""
    segment_name: str
    peak_velocity: float
    peak_timestamp_ms: float
    sequence_rank: int

@dataclass
class KineticChainMetrics:
    """Velocity sequencing metrics across the batting downswing."""
    sequence_score: float
    is_out_of_order: bool
    power_leaks: List[str]
    segments: List[KineticSegmentTiming]

@dataclass
class BattingMetrics:
    """Consolidated biomechanical evaluation metrics."""
    elbow: ElbowMetrics
    head: HeadMetrics
    stance: StanceMetrics
    footwork: FootworkMetrics
    hip_shoulder: HipShoulderMetrics
    knee: KneeMetrics
    wrist: WristMetrics
    centre_of_mass: CentreOfMassMetrics
    backlift: BackliftMetrics
    # PitchMind V1.2 features:
    timing: Optional[TimingMetrics] = None
    contact: Optional[ContactMetrics] = None
    tactical_alternatives: Optional[List[TacticalAlternative]] = None
    length_judging: Optional[LengthJudging] = None
    kinetic_chain: Optional[KineticChainMetrics] = None # 🆕 V0.4 Kinematic Sequence
    overall_score: float = 0.0         # Weighted blend of all category scores (0-100)
    stroke_type: str = "cover_drive"
    stroke_name: str = "Front-Foot Cover Drive"

