import numpy as np
from typing import List, Tuple
from pitchmind_ai.models.landmarks import FrameLandmarks

class DeliverySegmenter:
    """
    Segments a sequence of video frames into individual cricket deliveries
    based on the motion energy of the batsman's pose landmarks.
    """

    def __init__(
        self,
        motion_threshold: float = 0.012,
        smooth_window: int = 3,
        min_delivery_frames: int = 8,
        max_gap_frames: int = 8,
        padding_frames: int = 5
    ):
        self.motion_threshold = motion_threshold
        self.smooth_window = smooth_window
        self.min_delivery_frames = min_delivery_frames
        self.max_gap_frames = max_gap_frames
        self.padding_frames = padding_frames

    def segment(self, landmarks_sequence: List[FrameLandmarks]) -> List[Tuple[int, int]]:
        """
        Analyzes a sequence of FrameLandmarks and segments them into discrete deliveries.
        Returns a list of tuples: [(start_frame_index, end_frame_index), ...]
        """
        n_frames = len(landmarks_sequence)
        if n_frames < self.min_delivery_frames:
            # Not enough frames, return the entire video as one delivery
            return [(0, max(0, n_frames - 1))]

        # 1. Calculate frame-to-frame motion energy
        motion_energies = []
        for i in range(1, n_frames):
            prev_landmarks = landmarks_sequence[i - 1].landmarks
            curr_landmarks = landmarks_sequence[i].landmarks
            
            displacements = []
            # Calculate displacement for main joint keypoints to avoid nose/pinky jitter
            key_joints = [
                "LEFT_SHOULDER", "RIGHT_SHOULDER",
                "LEFT_ELBOW", "RIGHT_ELBOW",
                "LEFT_WRIST", "RIGHT_WRIST",
                "LEFT_HIP", "RIGHT_HIP",
                "LEFT_KNEE", "RIGHT_KNEE",
                "LEFT_ANKLE", "RIGHT_ANKLE"
            ]
            
            for joint in key_joints:
                if joint in prev_landmarks and joint in curr_landmarks:
                    p1 = prev_landmarks[joint]
                    p2 = curr_landmarks[joint]
                    # Calculate Euclidean distance in normalized 3D space
                    dist = np.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2 + (p2.z - p1.z)**2)
                    displacements.append(dist)
            
            if displacements:
                motion_energies.append(np.mean(displacements))
            else:
                motion_energies.append(0.0)

        # Prepend a 0 to match frame sequence indices (motion_energies has length n_frames-1)
        motion_energies = [0.0] + motion_energies

        # 2. Smooth motion energies using a moving average window
        smoothed_energies = []
        for i in range(n_frames):
            start_idx = max(0, i - self.smooth_window // 2)
            end_idx = min(n_frames, i + self.smooth_window // 2 + 1)
            smoothed_energies.append(np.mean(motion_energies[start_idx:end_idx]))

        # 3. Identify active motion frames (above threshold)
        active_mask = [energy >= self.motion_threshold for energy in smoothed_energies]

        # 4. Find contiguous active motion intervals
        intervals: List[Tuple[int, int]] = []
        in_interval = False
        start_idx = 0

        for i in range(n_frames):
            if active_mask[i] and not in_interval:
                in_interval = True
                start_idx = i
            elif not active_mask[i] and in_interval:
                in_interval = False
                intervals.append((start_idx, i - 1))
        
        if in_interval:
            intervals.append((start_idx, n_frames - 1))

        # 5. Merge intervals that have small gaps (max_gap_frames)
        merged_intervals: List[Tuple[int, int]] = []
        if not intervals:
            # If no intervals exceed threshold, fallback to entire video
            return [(0, n_frames - 1)]

        curr_interval = intervals[0]
        for next_interval in intervals[1:]:
            gap = next_interval[0] - curr_interval[1]
            if gap <= self.max_gap_frames:
                # Merge
                curr_interval = (curr_interval[0], next_interval[1])
            else:
                merged_intervals.append(curr_interval)
                curr_interval = next_interval
        merged_intervals.append(curr_interval)

        # 6. Apply minimum length filter and add padding
        final_deliveries: List[Tuple[int, int]] = []
        for start, end in merged_intervals:
            length = end - start + 1
            if length >= self.min_delivery_frames:
                # Pad the start and end indices slightly to capture full setup and completion
                padded_start = max(0, start - self.padding_frames)
                padded_end = min(n_frames - 1, end + self.padding_frames)
                
                # Check for overlap with the previous delivery
                if final_deliveries and padded_start <= final_deliveries[-1][1]:
                    # Adjust boundary to split the overlap halfway
                    prev_end = final_deliveries[-1][1]
                    midpoint = (prev_end + padded_start) // 2
                    final_deliveries[-1] = (final_deliveries[-1][0], midpoint)
                    padded_start = midpoint + 1
                
                final_deliveries.append((padded_start, padded_end))

        # 7. Fallback if no intervals survived minimum length filter
        if not final_deliveries:
            return [(0, n_frames - 1)]

        return final_deliveries
