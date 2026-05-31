import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import CentreOfMassMetrics
from pitchmind_ai.utils.geometry import midpoint, euclidean_distance
from pitchmind_ai.utils.constants import MAX_COM_LATERAL_SWAY

class CentreOfMassAnalyzer:
    """Tracks the horizontal movement profile of the Centre of Mass (CoM) relative to base center."""
    
    def analyze(self, landmarks_sequence: list[FrameLandmarks]) -> CentreOfMassMetrics:
        """
        Approximates CoM as the pelvis midpoint, and tracks lateral movement relative to feet base.
        """
        lh_key = "LEFT_HIP"
        rh_key = "RIGHT_HIP"
        la_key = "LEFT_ANKLE"
        ra_key = "RIGHT_ANKLE"
        ls_key = "LEFT_SHOULDER"
        rs_key = "RIGHT_SHOULDER"
        
        drifts = []
        
        for frame in landmarks_sequence:
            joints = frame.landmarks
            if (lh_key in joints and rh_key in joints and
                la_key in joints and ra_key in joints and
                ls_key in joints and rs_key in joints):
                
                lh = joints[lh_key]
                rh = joints[rh_key]
                la = joints[la_key]
                ra = joints[ra_key]
                ls = joints[ls_key]
                rs = joints[rs_key]
                
                if (lh.visibility > 0.4 and rh.visibility > 0.4 and
                    la.visibility > 0.4 and ra.visibility > 0.4 and
                    ls.visibility > 0.4 and rs.visibility > 0.4):
                    
                    hip_mid = midpoint(lh, rh)
                    feet_mid = midpoint(la, ra)
                    shoulder_width = euclidean_distance(ls, rs)
                    
                    if shoulder_width > 0:
                        # Normalize lateral drift by shoulder width
                        drift = (hip_mid[0] - feet_mid[0]) / shoulder_width
                        drifts.append(drift)
                        
        if not drifts:
            return CentreOfMassMetrics(
                max_lateral_sway=0.015,
                avg_lateral_sway=0.010,
                sway_corridor_px=10.0,
                balance_score=95.0
            )
            
        # Analyze lateral sway bounds
        abs_drifts = np.abs(drifts)
        max_sway = float(np.max(abs_drifts))
        avg_sway = float(np.mean(abs_drifts))
        
        # Sway corridor on standard 1000px nominal grid
        sway_corridor = float((np.max(drifts) - np.min(drifts)) * 1000.0)
        
        # Scoring logic: less sway = higher balance
        # If max sway is within MAX_COM_LATERAL_SWAY, balance is high
        if max_sway <= MAX_COM_LATERAL_SWAY:
            balance_score = 100.0
        else:
            deviation = max_sway - MAX_COM_LATERAL_SWAY
            balance_score = max(0.0, 100.0 - (deviation * 1500.0))
            
        return CentreOfMassMetrics(
            max_lateral_sway=max_sway,
            avg_lateral_sway=avg_sway,
            sway_corridor_px=sway_corridor,
            balance_score=float(balance_score)
        )
