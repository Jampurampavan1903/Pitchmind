import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import StanceMetrics
from pitchmind_ai.utils.geometry import euclidean_distance, midpoint

class StanceAnalyzer:
    """Evaluates the batter's setup stance width, hip alignment, and balance stability."""

    def analyze(self, landmarks_sequence: list[FrameLandmarks]) -> StanceMetrics:
        """
        Analyzes the batter's stance properties.
        - width_to_shoulder_ratio: Ratio of foot stance width to shoulder width.
        - balance_score: 0-100 rating based on center-of-mass (hips) horizontal alignment over the base of support (feet).
        """
        ratios = []
        balance_scores = []

        for frame in landmarks_sequence:
            joints = frame.landmarks
            
            # Check for shoulder and ankle coordinates
            if ("LEFT_SHOULDER" in joints and "RIGHT_SHOULDER" in joints and
                "LEFT_ANKLE" in joints and "RIGHT_ANKLE" in joints and
                "LEFT_HIP" in joints and "RIGHT_HIP" in joints):
                
                ls = joints["LEFT_SHOULDER"]
                rs = joints["RIGHT_SHOULDER"]
                la = joints["LEFT_ANKLE"]
                ra = joints["RIGHT_ANKLE"]
                lh = joints["LEFT_HIP"]
                rh = joints["RIGHT_HIP"]

                if (ls.visibility > 0.4 and rs.visibility > 0.4 and
                    la.visibility > 0.4 and ra.visibility > 0.4 and
                    lh.visibility > 0.4 and rh.visibility > 0.4):

                    # 1. Stance to Shoulder Width Ratio
                    shoulder_width = euclidean_distance(ls, rs)
                    stance_width = euclidean_distance(la, ra)
                    
                    if shoulder_width > 0:
                        ratio = stance_width / shoulder_width
                        ratios.append(ratio)

                    # 2. Hips center vs. feet base center (balance metric)
                    hip_mid = midpoint(lh, rh)
                    feet_mid = midpoint(la, ra)
                    
                    # Horizontal shift relative to shoulder width
                    if shoulder_width > 0:
                        horizontal_drift = abs(hip_mid[0] - feet_mid[0]) / shoulder_width
                        # Perfect balance is drift = 0. Penalize drift.
                        score = max(0.0, 100.0 - (horizontal_drift * 150.0))
                        balance_scores.append(score)

        if not ratios:
            return StanceMetrics(
                width_to_shoulder_ratio=1.2,
                balance_score=90.0
            )

        # Average the stance parameters over the setup/swing phase
        avg_ratio = float(np.mean(ratios))
        avg_balance = float(np.mean(balance_scores)) if balance_scores else 90.0

        # Adjust balance score: if the stance is extremely narrow (< 0.8) or wide (> 1.8), penalize balance
        if avg_ratio < 0.8:
            avg_balance -= (0.8 - avg_ratio) * 50.0
        elif avg_ratio > 1.8:
            avg_balance -= (avg_ratio - 1.8) * 50.0
            
        avg_balance = max(0.0, min(100.0, avg_balance))

        return StanceMetrics(
            width_to_shoulder_ratio=avg_ratio,
            balance_score=avg_balance
        )
