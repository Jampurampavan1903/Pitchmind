import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import ElbowMetrics
from pitchmind_ai.utils.geometry import calculate_angle
from pitchmind_ai.utils.constants import CRITICAL_DROPPED_ELBOW, IDEAL_ELBOW_RANGE

class ElbowAnalyzer:
    """Evaluates batting elbow alignment, extensions, and identifies technique drops."""
    
    def analyze(self, landmarks_sequence: list[FrameLandmarks], is_left_handed: bool = False) -> ElbowMetrics:
        """
        Processes a sequential landmark set to evaluate the lead elbow.
        - For standard right-handed batters, the front/lead arm is the LEFT arm.
        - For left-handed batters, the front/lead arm is the RIGHT arm.
        """
        # Lock lead joint keys based on stance hand orientation
        prefix = "RIGHT_" if is_left_handed else "LEFT_"
        shoulder_key = f"{prefix}SHOULDER"
        elbow_key = f"{prefix}ELBOW"
        wrist_key = f"{prefix}WRIST"
        
        angles = []
        timestamps = []
        
        for frame in landmarks_sequence:
            # Safe read: ensure joints are tracked in this frame
            joints = frame.landmarks
            if (shoulder_key in joints and 
                elbow_key in joints and 
                wrist_key in joints):
                
                # Fetch joint coordinate dataclasses
                shoulder = joints[shoulder_key]
                elbow = joints[elbow_key]
                wrist = joints[wrist_key]
                
                # Verify tracking confidence
                if (shoulder.visibility > 0.4 and 
                    elbow.visibility > 0.4 and 
                    wrist.visibility > 0.4):
                    
                    angle = calculate_angle(shoulder, elbow, wrist)
                    angles.append(angle)
                    timestamps.append(frame.timestamp_ms)
                    
        if not angles:
            # Fallback in case of absolute tracking occlusion
            return ElbowMetrics(
                max_backswing_angle=180.0,
                min_impact_angle=180.0,
                follow_through_angle=180.0,
                stability_score=100.0,
                is_dropped_elbow=False
            )
            
        # Biomechanical Moment Identification
        # - V1 Approximation:
        #   - Peak backswing occurs in the first 30% of the video sequence
        #   - Ball impact typically occurs in the middle 30% to 70% range
        #   - Follow-through is mapped to the final 30% of the timeline
        n_frames = len(angles)
        idx_backswing = int(n_frames * 0.3)
        idx_impact_end = int(n_frames * 0.7)
        
        backswing_angles = angles[:idx_backswing] if idx_backswing > 0 else [angles[0]]
        impact_angles = angles[idx_backswing:idx_impact_end] if idx_impact_end > idx_backswing else [angles[n_frames // 2]]
        follow_angles = angles[idx_impact_end:] if n_frames > idx_impact_end else [angles[-1]]
        
        max_backswing = float(np.max(backswing_angles))
        min_impact = float(np.min(impact_angles))
        follow_through = float(np.mean(follow_angles))
        
        # Flaw detection: Did the elbow flex too low during the stroke?
        is_dropped = min_impact < CRITICAL_DROPPED_ELBOW
        
        # Stability Score Calculation
        # Compute how close the impact extension is to our ideal range (155-180 deg)
        ideal_min, ideal_max = IDEAL_ELBOW_RANGE
        if min_impact >= ideal_min:
            stability_score = 100.0
        else:
            # Deduct score proportionally to the drop severity
            deviation = ideal_min - min_impact
            stability_score = max(0.0, 100.0 - (deviation * 2.5))
            
        return ElbowMetrics(
            max_backswing_angle=max_backswing,
            min_impact_angle=min_impact,
            follow_through_angle=follow_through,
            stability_score=float(stability_score),
            is_dropped_elbow=is_dropped
        )
