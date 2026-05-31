import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import KneeMetrics
from pitchmind_ai.utils.geometry import calculate_angle
from pitchmind_ai.utils.constants import IDEAL_KNEE_BRACE_RANGE, CRITICAL_KNEE_COLLAPSE

class KneeAnalyzer:
    """Evaluates the batsman's front/lead knee brace angle at impact and swing phases."""
    
    def analyze(self, landmarks_sequence: list[FrameLandmarks], is_left_handed: bool = False, stroke_type: str = "cover_drive") -> KneeMetrics:
        """
        Processes sequential landmarks to calculate the front knee brace profile.
        - Leads knee is LEFT for right-handers, RIGHT for left-handers.
        Ideal brace range at impact is 170° to 180° (extension).
        For sweep shots, ideal range shifts to 90° to 130° (knee bend is required).
        """
        prefix = "RIGHT_" if is_left_handed else "LEFT_"
        hip_key = f"{prefix}HIP"
        knee_key = f"{prefix}KNEE"
        ankle_key = f"{prefix}ANKLE"
        
        angles = []
        
        for frame in landmarks_sequence:
            joints = frame.landmarks
            if (hip_key in joints and knee_key in joints and ankle_key in joints):
                h = joints[hip_key]
                k = joints[knee_key]
                a = joints[ankle_key]
                
                if (h.visibility > 0.4 and k.visibility > 0.4 and a.visibility > 0.4):
                    angle = calculate_angle(h, k, a)
                    angles.append(angle)
                    
        if not angles:
            return KneeMetrics(
                angle_at_impact=175.0,
                min_angle=175.0,
                is_collapsed=False,
                brace_score=95.0
            )
            
        n_frames = len(angles)
        idx_impact_start = int(n_frames * 0.45)
        idx_impact_end = int(n_frames * 0.65)
        
        impact_angles = angles[idx_impact_start:idx_impact_end] if idx_impact_end > idx_impact_start else [angles[n_frames // 2]]
        
        # Estimate angle at impact as average/median or the direct center of impact zone
        angle_at_impact = float(impact_angles[len(impact_angles) // 2])
        min_angle = float(np.min(angles))
        
        is_collapsed = min_angle < CRITICAL_KNEE_COLLAPSE if stroke_type != "sweep_shot" else False
        
        # Scoring logic
        ideal_min, ideal_max = IDEAL_KNEE_BRACE_RANGE
        if stroke_type == "sweep_shot":
            ideal_min, ideal_max = 90.0, 130.0
            
        if angle_at_impact >= ideal_min and angle_at_impact <= ideal_max:
            brace_score = 100.0
        elif stroke_type == "sweep_shot" and angle_at_impact > ideal_max:
            # Too straight for a sweep shot
            deviation = angle_at_impact - ideal_max
            brace_score = max(0.0, 100.0 - (deviation * 3.0))
        else:
            deviation = ideal_min - angle_at_impact
            # Deduct score proportionally for excessive knee bend/collapse
            brace_score = max(0.0, 100.0 - (deviation * 3.0))
            
        return KneeMetrics(
            angle_at_impact=angle_at_impact,
            min_angle=min_angle,
            is_collapsed=is_collapsed,
            brace_score=float(brace_score)
        )
