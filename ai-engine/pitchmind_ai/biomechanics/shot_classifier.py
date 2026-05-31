import numpy as np
from typing import List, Tuple
from pitchmind_ai.models.landmarks import FrameLandmarks

class ShotClassifier:
    """
    Advanced biomechanical classifier that maps 3D joint coordinate trajectories
    to identify the played cricket stroke.
    """

    def classify(self, landmarks_sequence: List[FrameLandmarks], is_left_handed: bool = False) -> Tuple[str, str]:
        """
        Analyzes the landmark sequence and returns a tuple of:
        (stroke_type, stroke_name)
        
        Supported strokes:
        - 'cover_drive': "Front-Foot Cover Drive"
        - 'pull_shot': "Back-Foot Pull Shot"
        - 'cut_shot': "Back-Foot Cut Shot"
        - 'straight_drive': "Front-Foot Straight Drive"
        - 'forward_defensive': "Forward Defensive"
        """
        n_frames = len(landmarks_sequence)
        if n_frames < 4:
            return "cover_drive", "Front-Foot Cover Drive"

        # Resolve lead/rear coordinate labels
        lead_ankle = "RIGHT_ANKLE" if is_left_handed else "LEFT_ANKLE"
        rear_ankle = "LEFT_ANKLE" if is_left_handed else "RIGHT_ANKLE"
        lead_wrist = "LEFT_WRIST" if is_left_handed else "RIGHT_WRIST"
        lead_shoulder = "LEFT_SHOULDER" if is_left_handed else "RIGHT_SHOULDER"
        lead_elbow = "LEFT_ELBOW" if is_left_handed else "RIGHT_ELBOW"
        lead_hip = "LEFT_HIP" if is_left_handed else "RIGHT_HIP"

        # 🆕 Sweep Shot Detection: Did either knee drop flat close to the ground/ankle?
        min_rk_ra_y_diff = 999.0
        min_lk_la_y_diff = 999.0
        for f in landmarks_sequence:
            lk = f.landmarks.get("LEFT_KNEE")
            la = f.landmarks.get("LEFT_ANKLE")
            rk = f.landmarks.get("RIGHT_KNEE")
            ra = f.landmarks.get("RIGHT_ANKLE")
            if lk and la:
                min_lk_la_y_diff = min(min_lk_la_y_diff, abs(lk.y - la.y))
            if rk and ra:
                min_rk_ra_y_diff = min(min_rk_ra_y_diff, abs(rk.y - ra.y))
        
        if min_rk_ra_y_diff < 0.095 or min_lk_la_y_diff < 0.095:
            return "sweep_shot", "Front-Foot Sweep Shot"

        # 1. Analyze ankle stride displacement (front foot reaching forward)
        starts_lead = [f.landmarks.get(lead_ankle) for f in landmarks_sequence[:3] if lead_ankle in f.landmarks]
        ends_lead = [f.landmarks.get(lead_ankle) for f in landmarks_sequence[-3:] if lead_ankle in f.landmarks]
        
        starts_rear = [f.landmarks.get(rear_ankle) for f in landmarks_sequence[:3] if rear_ankle in f.landmarks]
        ends_rear = [f.landmarks.get(rear_ankle) for f in landmarks_sequence[-3:] if rear_ankle in f.landmarks]

        stride_diff = 0.0
        rear_backstep = 0.0

        if starts_lead and ends_lead and starts_lead[0] and ends_lead[-1]:
            # Positive diff means front foot stepping forward towards bowler
            stride_diff = (ends_lead[-1].x - starts_lead[0].x) if not is_left_handed else (starts_lead[0].x - ends_lead[-1].x)
            
        if starts_rear and ends_rear and starts_rear[0] and ends_rear[-1]:
            # Positive backstep means back foot stepping back away from bowler
            rear_backstep = (starts_rear[0].x - ends_rear[-1].x) if not is_left_handed else (ends_rear[-1].x - starts_rear[0].x)

        # 2. Analyze hand vertical finishing trajectory
        wrists_y = [f.landmarks.get(lead_wrist).y for f in landmarks_sequence if lead_wrist in f.landmarks and f.landmarks.get(lead_wrist)]
        shoulders_y = [f.landmarks.get(lead_shoulder).y for f in landmarks_sequence if lead_shoulder in f.landmarks and f.landmarks.get(lead_shoulder)]
        
        hands_finished_high = False
        hands_finished_low = False
        
        if wrists_y and shoulders_y:
            min_wrist_y = min(wrists_y) # Lower y means higher vertically in camera coordinates
            avg_shoulder_y = np.mean(shoulders_y)
            # If hands rise above shoulder level
            if min_wrist_y < avg_shoulder_y - 0.05:
                hands_finished_high = True
            # If hands remain close to hips/low chest
            elif min_wrist_y > avg_shoulder_y + 0.1:
                hands_finished_low = True

        # 3. Analyze lateral swing sweep (Pull vs Cut vs Drive)
        wrists_x = [f.landmarks.get(lead_wrist).x for f in landmarks_sequence if lead_wrist in f.landmarks and f.landmarks.get(lead_wrist)]
        hips_x = [f.landmarks.get(lead_hip).x for f in landmarks_sequence if lead_hip in f.landmarks and f.landmarks.get(lead_hip)]

        horizontal_span = 0.0
        if wrists_x and hips_x:
            # Maximum horizontal displacement of hands from hips
            horizontal_span = max(wrists_x) - min(wrists_x)

        # --- Decision Tree Shot Classification ---
        
        # Scenario A: Stride is very small or negative, back foot backstep is dominant (Back-foot committal)
        if stride_diff < 0.008 or rear_backstep > 0.015:
            if horizontal_span > 0.12:
                # Wide horizontal extension + backfoot weight transition = Pull Shot
                return "pull_shot", "Back-Foot Pull Shot"
            elif horizontal_span > 0.05:
                # Shorter lateral offside extension = Cut Shot
                return "cut_shot", "Back-Foot Cut Shot"
            else:
                # Low/neutral horizontal span on backfoot = Back-foot defensive block
                return "forward_defensive", "Forward Defensive"

        # Scenario B: Stride is forward and dominant (Front-foot committal)
        else:
            if hands_finished_low:
                # Defensive block (front foot forward, bat face closed and low)
                return "forward_defensive", "Forward Defensive"
            
            # Distinguish between Cover Drive and Straight Drive
            # Cover drive is played wide of offside (wrist sweeps laterally to the side)
            # Straight drive has hands sweeping straight forward through vertical shoulder axis
            if horizontal_span > 0.08:
                return "cover_drive", "Front-Foot Cover Drive"
            else:
                return "straight_drive", "Front-Foot Straight Drive"
