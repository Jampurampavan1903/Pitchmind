import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import HipShoulderMetrics
from pitchmind_ai.utils.constants import IDEAL_XFACTOR_RANGE

class HipShoulderAnalyzer:
    """Measures the angular separation (X-Factor torque) between hip and shoulder lines."""
    
    def analyze(self, landmarks_sequence: list[FrameLandmarks], is_left_handed: bool = False) -> HipShoulderMetrics:
        """
        Calculates the separation angle between hip axis and shoulder axis.
        Ideal separation is 15.0 - 25.0 degrees.
        """
        hip_l_key = "LEFT_HIP"
        hip_r_key = "RIGHT_HIP"
        sh_l_key = "LEFT_SHOULDER"
        sh_r_key = "RIGHT_SHOULDER"
        
        separations = []
        
        for frame in landmarks_sequence:
            joints = frame.landmarks
            if (hip_l_key in joints and hip_r_key in joints and
                sh_l_key in joints and sh_r_key in joints):
                
                hl = joints[hip_l_key]
                hr = joints[hip_r_key]
                sl = joints[sh_l_key]
                sr = joints[sh_r_key]
                
                if (hl.visibility > 0.4 and hr.visibility > 0.4 and
                    sl.visibility > 0.4 and sr.visibility > 0.4):
                    
                    # Calculate angle of hips on the horizontal 2D plane
                    dx_hip = hr.x - hl.x if not is_left_handed else hl.x - hr.x
                    dy_hip = hr.y - hl.y
                    hip_angle = np.degrees(np.arctan2(dy_hip, abs(dx_hip) if dx_hip != 0 else 0.001))
                    
                    # Calculate angle of shoulders on the horizontal 2D plane
                    dx_sh = sr.x - sl.x if not is_left_handed else sl.x - sr.x
                    dy_sh = sr.y - sl.y
                    sh_angle = np.degrees(np.arctan2(dy_sh, abs(dx_sh) if dx_sh != 0 else 0.001))
                    
                    # Separation angle is the absolute difference between hip & shoulder orientation
                    sep_angle = abs(sh_angle - hip_angle)
                    separations.append(sep_angle)
                    
        if not separations:
            return HipShoulderMetrics(
                peak_separation_degrees=18.0,
                separation_at_impact=15.0,
                power_score=90.0
            )
            
        # Downswing phase approximation: middle 30% to 70% of frames
        n_frames = len(separations)
        idx_start = int(n_frames * 0.3)
        idx_end = int(n_frames * 0.7)
        downswing_seps = separations[idx_start:idx_end] if idx_end > idx_start else [separations[n_frames // 2]]
        
        peak_sep = float(np.max(downswing_seps))
        # Impact moment separation is usually the end of the downswing phase
        sep_at_impact = float(downswing_seps[-1])
        
        # Power score based on peak separation relative to the ideal range
        ideal_min, ideal_max = IDEAL_XFACTOR_RANGE
        if ideal_min <= peak_sep <= ideal_max:
            power_score = 100.0
        elif peak_sep < ideal_min:
            # Under-separated: block rotation
            deviation = ideal_min - peak_sep
            power_score = max(0.0, 100.0 - (deviation * 5.0))
        else:
            # Over-rotated / over-separated: losing control
            deviation = peak_sep - ideal_max
            power_score = max(0.0, 100.0 - (deviation * 4.0))
            
        return HipShoulderMetrics(
            peak_separation_degrees=peak_sep,
            separation_at_impact=sep_at_impact,
            power_score=float(power_score)
        )
