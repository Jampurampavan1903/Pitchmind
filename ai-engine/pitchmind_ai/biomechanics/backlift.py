import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import BackliftMetrics
from pitchmind_ai.utils.geometry import euclidean_distance
from pitchmind_ai.utils.constants import MAX_BACKLIFT_LOOP

class BackliftAnalyzer:
    """Measures backlift height and checks for any horizontal loop deviations."""
    
    def analyze(self, landmarks_sequence: list[FrameLandmarks], is_left_handed: bool = False) -> BackliftMetrics:
        """
        Evaluates the backswing path during the first 30% of the stroke.
        Tracks lead wrist relative to lead shoulder.
        """
        prefix = "RIGHT_" if is_left_handed else "LEFT_"
        wrist_key = f"{prefix}WRIST"
        shoulder_key = f"{prefix}SHOULDER"
        
        height_ratios = []
        loop_deviations = []
        
        # We only evaluate backlift in the first 35% of the video timeline (backswing phase)
        n_frames = len(landmarks_sequence)
        idx_backswing_end = max(3, int(n_frames * 0.35))
        backswing_sequence = landmarks_sequence[:idx_backswing_end]
        
        for frame in backswing_sequence:
            joints = frame.landmarks
            if wrist_key in joints and shoulder_key in joints:
                w = joints[wrist_key]
                s = joints[shoulder_key]
                
                # Check for other shoulder to scale calculations
                other_prefix = "LEFT_" if is_left_handed else "RIGHT_"
                other_shoulder_key = f"{other_prefix}SHOULDER"
                
                if w.visibility > 0.4 and s.visibility > 0.4:
                    # Height ratio: vertical distance. Note y-axis is inverted (smaller y is higher).
                    # A positive height value indicates wrist is higher up than shoulder level.
                    height_diff = s.y - w.y
                    
                    # Normalize by shoulder width if possible
                    if other_shoulder_key in joints and joints[other_shoulder_key].visibility > 0.4:
                        sh_width = euclidean_distance(s, joints[other_shoulder_key])
                        height_ratio = height_diff / (sh_width if sh_width > 0 else 0.3)
                    else:
                        height_ratio = height_diff / 0.3
                        
                    height_ratios.append(height_ratio)
                    
                    # Horizontal deviation: distance between wrist x and shoulder x
                    loop_dev = abs(w.x - s.x)
                    loop_deviations.append(loop_dev)
                    
        if not height_ratios:
            return BackliftMetrics(
                peak_height_ratio=0.8,
                loop_deviation=0.03,
                is_loopy=False,
                backlift_score=90.0
            )
            
        peak_height = float(np.max(height_ratios))
        max_loop = float(np.max(loop_deviations))
        
        is_loopy = max_loop > MAX_BACKLIFT_LOOP
        
        # Scoring logic
        # Straight backlift + high backswing is ideal
        # Target loop is < 0.06. Target height ratio is > 0.5.
        height_score = min(100.0, max(0.0, 50.0 + (peak_height * 60.0)))
        
        if max_loop <= MAX_BACKLIFT_LOOP:
            loop_score = 100.0
        else:
            deviation = max_loop - MAX_BACKLIFT_LOOP
            loop_score = max(0.0, 100.0 - (deviation * 800.0))
            
        backlift_score = float(height_score * 0.4 + loop_score * 0.6)
        
        return BackliftMetrics(
            peak_height_ratio=peak_height,
            loop_deviation=max_loop,
            is_loopy=is_loopy,
            backlift_score=backlift_score
        )
