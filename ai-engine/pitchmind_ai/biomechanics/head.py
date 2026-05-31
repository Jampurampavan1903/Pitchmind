import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import HeadMetrics

class HeadAnalyzer:
    """Evaluates batter's head stability and eye-level tilt across the video sequence."""

    def analyze(self, landmarks_sequence: list[FrameLandmarks]) -> HeadMetrics:
        """
        Analyzes the motion profile of the head.
        - movement_std_dev_px: Standard deviation of head (NOSE) x and y position in nominal pixels.
        - eye_level_tilt_degrees: Maximum shoulder axis tilt relative to horizontal as proxy for eye-level.
        - stability_score: 0-100 rating based on deviation and tilt.
        """
        nose_coords = []
        shoulder_tilts = []

        for frame in landmarks_sequence:
            joints = frame.landmarks
            
            # 1. Track nose movement
            if "NOSE" in joints:
                nose = joints["NOSE"]
                if nose.visibility > 0.4:
                    # Map [0, 1] normalized coordinates to a nominal 1000px grid for standard pixel representation
                    nose_coords.append((nose.x * 1000.0, nose.y * 1000.0))

            # 2. Track shoulder alignment (proxy for head tilt and eye line)
            if "LEFT_SHOULDER" in joints and "RIGHT_SHOULDER" in joints:
                ls = joints["LEFT_SHOULDER"]
                rs = joints["RIGHT_SHOULDER"]
                if ls.visibility > 0.4 and rs.visibility > 0.4:
                    dx = rs.x - ls.x
                    dy = rs.y - ls.y
                    # Calculate angle with the horizontal plane
                    if dx != 0:
                        tilt = np.degrees(np.arctan2(dy, abs(dx)))
                        shoulder_tilts.append(abs(tilt))

        # Default values if tracking quality is insufficient
        if not nose_coords:
            return HeadMetrics(
                movement_std_dev_px=0.0,
                eye_level_tilt_degrees=0.0,
                stability_score=100.0
            )

        # Calculate standard deviation of movement in nominal pixels
        nose_arr = np.array(nose_coords)
        std_x = np.std(nose_arr[:, 0])
        std_y = np.std(nose_arr[:, 1])
        movement_std_dev = float(np.sqrt(std_x**2 + std_y**2))

        # Calculate active tilt deviation relative to the starting stance frames
        # This is extremely robust for side-on batting videos where absolute 2D shoulder projection
        # slope is naturally steep (~85°), yet the batsman keeps their head completely still and eyes level
        active_tilts = []
        if shoulder_tilts:
            baseline_tilt = np.mean(shoulder_tilts[:3])
            active_tilts = [abs(t - baseline_tilt) for t in shoulder_tilts]
            
        max_tilt = float(np.max(active_tilts)) if active_tilts else 0.0

        # Calculate score (100 is perfect stability)
        # Standard deviation > 30px or tilt > 15 degrees signifies significant instability
        dev_penalty = movement_std_dev * 1.5
        tilt_penalty = max_tilt * 2.0
        stability_score = max(0.0, min(100.0, 100.0 - (dev_penalty + tilt_penalty)))

        return HeadMetrics(
            movement_std_dev_px=movement_std_dev,
            eye_level_tilt_degrees=max_tilt,
            stability_score=float(stability_score)
        )
