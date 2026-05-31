import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import WristMetrics

class WristAnalyzer:
    """Tracks wrist roll (supination/pronation) orientation by comparing wrist and index coordinates."""
    
    def analyze(self, landmarks_sequence: list[FrameLandmarks], is_left_handed: bool = False, stroke_type: str = "cover_drive") -> WristMetrics:
        """
        Evaluates wrist rotation alignment using wrist and index finger coordinates.
        - For cover_drive: Supination (index remains higher/vertical, preserving open face) is ideal.
        - For pull_shot: Pronation (index rolls under, closing the face to ground the shot) is ideal.
        - For cut_shot: Precise horizontal extension.
        """
        prefix = "RIGHT_" if is_left_handed else "LEFT_"
        wrist_key = f"{prefix}WRIST"
        index_key = f"{prefix}INDEX"
        
        deltas = []
        timestamps = []
        
        for frame in landmarks_sequence:
            joints = frame.landmarks
            if wrist_key in joints and index_key in joints:
                w = joints[wrist_key]
                idx = joints[index_key]
                
                if w.visibility > 0.4 and idx.visibility > 0.4:
                    # Vertical offset (y-axis). In screen coordinates, smaller y is HIGHER up.
                    # A positive delta means index is HIGHER (smaller y) than wrist.
                    delta = w.y - idx.y
                    deltas.append(delta)
                    timestamps.append(frame.timestamp_ms)
                    
        # Fallback if joints are occluded
        if not deltas:
            return WristMetrics(
                roll_direction="supinated" if stroke_type != "pull_shot" else "pronated",
                max_roll_delta=0.05,
                roll_timing_pct=0.5,
                control_score=85.0
            )
            
        # Peak absolute delta
        peak_idx = int(np.argmax(np.abs(deltas)))
        max_delta = float(deltas[peak_idx])
        timing_pct = float(peak_idx / len(deltas))
        
        # Classify orientation direction based on peak vertical offset sign
        direction = "supinated" if max_delta > 0 else "pronated"
        
        # Scoring logic based on stroke context
        if stroke_type in ["pull_shot", "sweep_shot"]:
            # Pull shot / Sweep shot REQUIRES wrist rollover (pronation - index drops below wrist)
            if direction == "pronated":
                # Good rollover
                control_score = min(100.0, 75.0 + abs(max_delta) * 500.0)
            else:
                # Failed rollover: open-faced danger
                control_score = max(0.0, 75.0 - abs(max_delta) * 600.0)
        elif stroke_type == "cut_shot":
            # Cut shot is a lateral punch: requires medium/neutral control
            control_score = max(0.0, 100.0 - abs(max_delta - 0.01) * 300.0)
        else:
            # Default Cover Drive: requires wrist supination (keeping index high to prevent cross-batting)
            if direction == "supinated":
                control_score = min(100.0, 70.0 + abs(max_delta) * 600.0)
            else:
                control_score = max(0.0, 70.0 - abs(max_delta) * 800.0)
                
        return WristMetrics(
            roll_direction=direction,
            max_roll_delta=max_delta,
            roll_timing_pct=timing_pct,
            control_score=float(control_score)
        )
