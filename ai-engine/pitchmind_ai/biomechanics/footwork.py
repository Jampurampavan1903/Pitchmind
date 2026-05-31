import numpy as np
from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import FootworkMetrics
from pitchmind_ai.utils.geometry import euclidean_distance

class FootworkAnalyzer:
    """Evaluates batter footwork stride profiles, lateral extension, and stride-to-swing sync timing."""

    def analyze(self, landmarks_sequence: list[FrameLandmarks], is_left_handed: bool = False) -> FootworkMetrics:
        """
        Analyzes the footwork dynamics.
        - stride_length_px: Peak dynamic distance between ankles in nominal pixels.
        - timing_delay_ms: Time delay between peak foot stride and swing impact.
        - stride_ratio: Peak ankle distance normalized by the player's stance shoulder width.
        - alignment_angle: Angle of the stride relative to the crease line.
        - weight_transfer_pct: Estimated shift of center of gravity towards the front foot.
        - is_step_across: Technique flaw flag if front foot crosses over too far, blocking the pads.
        """
        foot_distances = []
        timestamps = []
        lead_elbow_angles = []
        shoulder_widths = []
        hip_positions = []
        left_ankles = []
        right_ankles = []

        # Hand stance orientation keys
        prefix_lead = "RIGHT_" if is_left_handed else "LEFT_"
        shoulder_key = f"{prefix_lead}SHOULDER"
        elbow_key = f"{prefix_lead}ELBOW"
        wrist_key = f"{prefix_lead}WRIST"

        for frame in landmarks_sequence:
            joints = frame.landmarks
            
            # Track shoulder width in nominal coordinates to normalize the stride
            if "LEFT_SHOULDER" in joints and "RIGHT_SHOULDER" in joints:
                ls = joints["LEFT_SHOULDER"]
                rs = joints["RIGHT_SHOULDER"]
                if ls.visibility > 0.4 and rs.visibility > 0.4:
                    width = euclidean_distance(ls, rs) * 1000.0
                    shoulder_widths.append(width)

            # Track hips for weight transfer estimation
            if "LEFT_HIP" in joints and "RIGHT_HIP" in joints:
                lh = joints["LEFT_HIP"]
                rh = joints["RIGHT_HIP"]
                if lh.visibility > 0.4 and rh.visibility > 0.4:
                    hip_positions.append((frame.timestamp_ms, 0.5 * (lh.x + rh.x)))
            
            # Track foot distance
            if "LEFT_ANKLE" in joints and "RIGHT_ANKLE" in joints:
                la = joints["LEFT_ANKLE"]
                ra = joints["RIGHT_ANKLE"]
                if la.visibility > 0.4 and ra.visibility > 0.4:
                    # Ankle coordinate distance scaled to nominal 1000px coordinate grid
                    dist = euclidean_distance(la, ra) * 1000.0
                    foot_distances.append(dist)
                    timestamps.append(frame.timestamp_ms)
                    left_ankles.append((frame.timestamp_ms, la))
                    right_ankles.append((frame.timestamp_ms, ra))
            
            # Track lead elbow angle in the same loop to find the impact moment
            if shoulder_key in joints and elbow_key in joints and wrist_key in joints:
                s = joints[shoulder_key]
                e = joints[elbow_key]
                w = joints[wrist_key]
                if s.visibility > 0.4 and e.visibility > 0.4 and w.visibility > 0.4:
                    # Simple angle vector math inline
                    p_s = np.array([s.x, s.y, s.z])
                    p_e = np.array([e.x, e.y, e.z])
                    p_w = np.array([w.x, w.y, w.z])
                    
                    se = p_s - p_e
                    ew = p_w - p_e
                    denom = np.linalg.norm(se) * np.linalg.norm(ew)
                    if denom > 0:
                        cos_ang = np.dot(se, ew) / denom
                        cos_ang = np.clip(cos_ang, -1.0, 1.0)
                        angle = np.degrees(np.arccos(cos_ang))
                        lead_elbow_angles.append((frame.timestamp_ms, angle))

        # Fallback values if tracking details are missing
        default_shoulder_width = np.mean(shoulder_widths) if shoulder_widths else 150.0

        if not foot_distances:
            return FootworkMetrics(
                stride_length_px=150.0,
                timing_delay_ms=50.0,
                stride_ratio=1.0,
                alignment_angle=5.0,
                weight_transfer_pct=50.0,
                is_step_across=False
            )

        # 1. Stride Length: Maximum distance achieved during the swing sequence
        stride_length = float(np.max(foot_distances))

        # Normalize stride by shoulder width
        avg_shoulder_width = float(np.mean(shoulder_widths)) if shoulder_widths else default_shoulder_width
        stride_ratio = stride_length / avg_shoulder_width if avg_shoulder_width > 0 else 1.0

        # 2. Timing Delay: Identify alignment sync between stride completion and swing impact
        # - Peak stride frame timestamp
        max_stride_idx = np.argmax(foot_distances)
        stride_completion_time = timestamps[max_stride_idx]

        # - Swing impact (approximate as minimum elbow angle/flexion point during downswing range)
        if lead_elbow_angles:
            times = [item[0] for item in lead_elbow_angles]
            angles = [item[1] for item in lead_elbow_angles]
            min_elbow_idx = np.argmin(angles)
            impact_time = times[min_elbow_idx]
            timing_delay = float(impact_time - stride_completion_time)
        else:
            timing_delay = 50.0

        # Bound delay ranges
        timing_delay = max(-200.0, min(500.0, timing_delay))

        # 3. Alignment Angle & Step-Across Flaw
        # Look at the ankle coordinates at the peak stride moment
        la_at_peak = left_ankles[max_stride_idx][1]
        ra_at_peak = right_ankles[max_stride_idx][1]

        # Stride lateral displacement
        dx = la_at_peak.x - ra_at_peak.x
        dy = la_at_peak.y - ra_at_peak.y
        alignment_angle = abs(float(np.degrees(np.arctan2(abs(dy), abs(dx)))))
        
        # Step-across detection (front foot closing the face excessively)
        # If right-handed, front foot is Left Ankle.
        # If left ankle crosses too far towards off-side (lower x relative to right ankle)
        is_step_across = False
        if not is_left_handed:
            # If left ankle's x coordinate is too far to the right of the stance (lower x)
            is_step_across = float(ra_at_peak.x - la_at_peak.x) < 0.04
        else:
            # Opposite for lefties
            is_step_across = float(la_at_peak.x - ra_at_peak.x) < 0.04

        # 4. Weight Transfer percentage
        # Estimate weight transfer based on hip x-axis shift at peak stride relative to feet midpoint
        weight_transfer_pct = 50.0
        # Find hip position at stride completion
        closest_hip_x = 0.5
        if hip_positions:
            hip_diffs = [abs(h[0] - stride_completion_time) for h in hip_positions]
            min_idx = np.argmin(hip_diffs)
            closest_hip_x = hip_positions[min_idx][1]

        # Calculate position of hip relative to ankles
        min_x = min(la_at_peak.x, ra_at_peak.x)
        max_x = max(la_at_peak.x, ra_at_peak.x)
        span = max_x - min_x
        if span > 0:
            if not is_left_handed:
                # For right handers, front foot is Left Ankle (which is typically lower X)
                # More weight forward = hip closer to Left Ankle (lower x)
                pct = (ra_at_peak.x - closest_hip_x) / span * 100.0
            else:
                # Opposite for left handers
                pct = (closest_hip_x - la_at_peak.x) / span * 100.0
            
            weight_transfer_pct = float(np.clip(pct, 20.0, 95.0))

        return FootworkMetrics(
            stride_length_px=round(stride_length, 1),
            timing_delay_ms=round(timing_delay, 1),
            stride_ratio=round(stride_ratio, 2),
            alignment_angle=round(alignment_angle, 1),
            weight_transfer_pct=round(weight_transfer_pct, 1),
            is_step_across=is_step_across
        )
