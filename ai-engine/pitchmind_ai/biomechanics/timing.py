import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import TimingMetrics

class TimingAnalyzer:
    """
    Evaluates batting stroke timing by analyzing the sync between peak wrist kinetic velocity
    and the moment of ball-bat impact.
    """

    def analyze(self, landmarks_sequence: list[FrameLandmarks], is_left_handed: bool = False) -> TimingMetrics:
        """
        Calculates wrist velocity curves and compares peak swing acceleration against impact timing.
        """
        if len(landmarks_sequence) < 5:
            return TimingMetrics(timing_delta_ms=0.0, rating="optimal", score=90.0)

        wrist_key = "RIGHT_WRIST" if is_left_handed else "LEFT_WRIST"
        shoulder_key = "RIGHT_SHOULDER" if is_left_handed else "LEFT_SHOULDER"

        timestamps = []
        wrist_positions = []
        shoulder_y = []

        for frame in landmarks_sequence:
            joints = frame.landmarks
            if wrist_key in joints and joints[wrist_key].visibility > 0.4:
                w = joints[wrist_key]
                wrist_positions.append(np.array([w.x, w.y, w.z]))
                timestamps.append(frame.timestamp_ms)
            if shoulder_key in joints:
                shoulder_y.append(joints[shoulder_key].y)

        if len(wrist_positions) < 3:
            return TimingMetrics(timing_delta_ms=0.0, rating="optimal", score=85.0)

        # 1. Calculate kinetic velocity of the wrist (using coordinate differences over time)
        velocities = []
        vel_times = []
        for i in range(1, len(wrist_positions) - 1):
            # Distance difference between next and previous frame (central differences for smoothing)
            dt = (timestamps[i+1] - timestamps[i-1]) / 1000.0 # seconds
            if dt > 0:
                dist = np.linalg.norm(wrist_positions[i+1] - wrist_positions[i-1])
                vel = dist / dt # velocity in normalized coordinates per second
                velocities.append(vel)
                vel_times.append(timestamps[i])

        if not velocities:
            return TimingMetrics(timing_delta_ms=0.0, rating="optimal", score=80.0)

        # 2. Identify the swing phase (ignore initial stance rest and final follow through)
        # Swing usually happens in the middle/latter half of the video.
        n_vel = len(velocities)
        swing_start_idx = int(n_vel * 0.2)
        swing_end_idx = int(n_vel * 0.8)
        
        swing_velocities = velocities[swing_start_idx:swing_end_idx]
        swing_times = vel_times[swing_start_idx:swing_end_idx]

        if not swing_velocities:
            swing_velocities = velocities
            swing_times = vel_times

        # Peak Velocity moment
        peak_vel_idx = np.argmax(swing_velocities)
        peak_vel_time = swing_times[peak_vel_idx]

        # 3. Identify Ball Impact moment:
        # In cricket batting, impact happens at the lowest point of the swing arc
        # (which corresponds to the maximum Y-value in MediaPipe space since Y increases downwards).
        swing_wrists = wrist_positions[swing_start_idx:swing_end_idx]
        if not swing_wrists:
            swing_wrists = wrist_positions

        y_positions = [pos[1] for pos in swing_wrists]
        max_y_idx = np.argmax(y_positions)
        impact_time = swing_times[min(max_y_idx, len(swing_times)-1)]

        # 4. Calculate timing delta: impact time relative to peak velocity
        # Ideal: peak velocity is achieved exactly at impact (delta = 0).
        # Positive delta: Peak velocity happened BEFORE impact (decelerating at contact = Late shot).
        # Negative delta: Peak velocity happened AFTER impact (struck before full extension = Early shot).
        timing_delta_ms = float(impact_time - peak_vel_time)

        # Cap the output boundary range
        timing_delta_ms = max(-150.0, min(150.0, timing_delta_ms))

        # 5. Rate and Score
        abs_delta = abs(timing_delta_ms)
        
        # Define optimal timing window as +/- 15ms
        if abs_delta <= 15.0:
            rating = "optimal"
            # Scale from 95 to 100 for near perfect sync
            score = 100.0 - 5.0 * (abs_delta / 15.0)
        elif timing_delta_ms < -15.0:
            rating = "early"
            # Early timing penalty: subtract 1.5 points per ms beyond the optimal window
            score = max(40.0, 95.0 - 1.5 * (abs_delta - 15.0))
        else:
            rating = "late"
            # Late timing penalty
            score = max(40.0, 95.0 - 1.5 * (abs_delta - 15.0))

        return TimingMetrics(
            timing_delta_ms=round(timing_delta_ms, 1),
            rating=rating,
            score=round(score, 1)
        )
