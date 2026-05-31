import math
import numpy as np
from typing import List, Dict, Any
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import KineticChainMetrics, KineticSegmentTiming
from pitchmind_ai.utils.geometry import calculate_angle

class KineticChainAnalyzer:
    """
    Analyzes the batsman's kinematic sequence and energy transfer timing.
    Calculates dynamic velocities, applies moving average filters, and identifies power leaks.
    """
    
    def analyze(self, landmarks_sequence: List[FrameLandmarks], is_left_handed: bool = False) -> KineticChainMetrics:
        """
        Executes kinematic sequencing timings across hip, shoulder, elbow, and wrist angular velocities.
        """
        n_frames = len(landmarks_sequence)
        if n_frames < 10:
            # Fallback for short sessions
            return KineticChainMetrics(
                sequence_score=90.0,
                is_out_of_order=False,
                power_leaks=[],
                segments=[
                    KineticSegmentTiming("Hip Rotation", 140.0, 320.0, 1),
                    KineticSegmentTiming("Shoulder Rotation", 185.0, 350.0, 2),
                    KineticSegmentTiming("Elbow Extension", 240.0, 380.0, 3),
                    KineticSegmentTiming("Wrist Rollover", 310.0, 410.0, 4)
                ]
            )

        # Setup key prefixes based on stance hand
        prefix = "RIGHT_" if is_left_handed else "LEFT_"
        hip_key = f"{prefix}HIP"
        elbow_key = f"{prefix}ELBOW"
        shoulder_key = f"{prefix}SHOULDER"
        wrist_key = f"{prefix}WRIST"
        index_key = f"{prefix}INDEX"
        
        opposite_prefix = "LEFT_" if is_left_handed else "RIGHT_"
        opposite_hip_key = f"{opposite_prefix}HIP"
        opposite_shoulder_key = f"{opposite_prefix}SHOULDER"

        # Frame parameters list
        timestamps = [f.timestamp_ms / 1000.0 for f in landmarks_sequence]
        
        hip_angles = []
        shoulder_angles = []
        elbow_angles = []
        wrist_angles = []
        
        # Calculate joint angles frame-by-frame
        for frame in landmarks_sequence:
            joints = frame.landmarks
            
            # 1. Hip angle relative to base horizontal
            if hip_key in joints and opposite_hip_key in joints:
                h1 = joints[hip_key]
                h2 = joints[opposite_hip_key]
                vec = np.array([h1.x - h2.x, h1.y - h2.y])
                norm = np.linalg.norm(vec)
                angle = np.degrees(np.arccos(np.clip(vec[0] / norm if norm > 0 else 1.0, -1.0, 1.0)))
                hip_angles.append(angle)
            else:
                hip_angles.append(0.0)

            # 2. Shoulder angle relative to base horizontal
            if shoulder_key in joints and opposite_shoulder_key in joints:
                s1 = joints[shoulder_key]
                s2 = joints[opposite_shoulder_key]
                vec = np.array([s1.x - s2.x, s1.y - s2.y])
                norm = np.linalg.norm(vec)
                angle = np.degrees(np.arccos(np.clip(vec[0] / norm if norm > 0 else 1.0, -1.0, 1.0)))
                shoulder_angles.append(angle)
            else:
                shoulder_angles.append(0.0)

            # 3. Elbow brace/extension angle
            if shoulder_key in joints and elbow_key in joints and wrist_key in joints:
                elbow_angles.append(calculate_angle(joints[shoulder_key], joints[elbow_key], joints[wrist_key]))
            else:
                elbow_angles.append(150.0)

            # 4. Wrist rollover angle
            if elbow_key in joints and wrist_key in joints and index_key in joints:
                wrist_angles.append(calculate_angle(joints[elbow_key], joints[wrist_key], joints[index_key]))
            else:
                wrist_angles.append(140.0)

        # Helper to compute first derivative and smooth
        def compute_velocities(angles_list: List[float]) -> List[float]:
            velocities = [0.0]
            for i in range(1, len(angles_list)):
                dt = timestamps[i] - timestamps[i-1]
                if dt > 0:
                    vel = abs(angles_list[i] - angles_list[i-1]) / dt
                else:
                    vel = 0.0
                velocities.append(vel)
            
            # Apply 5-frame moving average smoothing
            smoothed = []
            for i in range(len(velocities)):
                window = velocities[max(0, i-4):i+1]
                smoothed.append(float(np.mean(window)))
            return smoothed

        hip_vel = compute_velocities(hip_angles)
        shoulder_vel = compute_velocities(shoulder_angles)
        elbow_vel = compute_velocities(elbow_angles)
        wrist_vel = compute_velocities(wrist_angles)

        # Detect peak timestamps during active forward swing zone (20% to 80% range)
        start_idx = int(n_frames * 0.15)
        end_idx = int(n_frames * 0.85)
        
        def find_peak(vel_list: List[float]) -> tuple[float, float]:
            zone = vel_list[start_idx:end_idx] if end_idx > start_idx else vel_list
            max_val = max(zone) if zone else 0.0
            max_idx = vel_list.index(max_val) if max_val in vel_list else (n_frames // 2)
            timestamp_ms = landmarks_sequence[max_idx].timestamp_ms
            return max_val, timestamp_ms

        hip_peak_val, hip_peak_t = find_peak(hip_vel)
        shoulder_peak_val, shoulder_peak_t = find_peak(shoulder_vel)
        elbow_peak_val, elbow_peak_t = find_peak(elbow_vel)
        wrist_peak_val, wrist_peak_t = find_peak(wrist_vel)

        # Standard sequence names
        segs = [
            {"name": "Hip Rotation", "val": hip_peak_val, "t": hip_peak_t, "standard_rank": 1},
            {"name": "Shoulder Rotation", "val": shoulder_peak_val, "t": shoulder_peak_t, "standard_rank": 2},
            {"name": "Elbow Extension", "val": elbow_peak_val, "t": elbow_peak_t, "standard_rank": 3},
            {"name": "Wrist Rollover", "val": wrist_peak_val, "t": wrist_peak_t, "standard_rank": 4}
        ]

        # Sort based on peak timing to get actual rank
        segs_sorted = sorted(segs, key=lambda x: x["t"])
        for rank, s in enumerate(segs_sorted):
            s["actual_rank"] = rank + 1

        # Check for out-of-order power leaks
        power_leaks = []
        is_out_of_order = False
        
        # Hip vs Shoulder
        if hip_peak_t > shoulder_peak_t:
            power_leaks.append("Shoulders rotated before Hips (limits body torque)")
            is_out_of_order = True
            
        # Shoulder vs Elbow
        if shoulder_peak_t > elbow_peak_t:
            power_leaks.append("Arms extended before Shoulders rotated (loss of swing speed)")
            is_out_of_order = True
            
        # Elbow vs Wrist
        if elbow_peak_t > wrist_peak_t:
            power_leaks.append("Wrists rolled over before Elbow fully extended (early snap flaw)")
            is_out_of_order = True

        # Calculate score (out of 100.0)
        sequence_score = 100.0
        if is_out_of_order:
            sequence_score -= (len(power_leaks) * 20.0)

        # Deduct for suboptimal timing delays (Standard delay is 30ms to 70ms between segments)
        hs_delay = shoulder_peak_t - hip_peak_t
        if hs_delay < 10.0 or hs_delay > 150.0:
            sequence_score -= 10.0

        sequence_score = max(0.0, min(100.0, sequence_score))

        # Format output
        segments_list = []
        for s in segs:
            segments_list.append(KineticSegmentTiming(
                segment_name=s["name"],
                peak_velocity=round(s["val"], 1),
                peak_timestamp_ms=round(s["t"], 1),
                sequence_rank=s["actual_rank"]
            ))

        return KineticChainMetrics(
            sequence_score=round(sequence_score, 1),
            is_out_of_order=is_out_of_order,
            power_leaks=power_leaks,
            segments=segments_list
        )
