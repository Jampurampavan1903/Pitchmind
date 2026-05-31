# --- MediaPipe Pose Landmark Index Mappings ---
LANDMARK_MAP = {
    0: "NOSE",
    11: "LEFT_SHOULDER",
    12: "RIGHT_SHOULDER",
    13: "LEFT_ELBOW",
    14: "RIGHT_ELBOW",
    15: "LEFT_WRIST",
    16: "RIGHT_WRIST",
    19: "LEFT_INDEX",
    20: "RIGHT_INDEX",
    23: "LEFT_HIP",
    24: "RIGHT_HIP",
    25: "LEFT_KNEE",
    26: "RIGHT_KNEE",
    27: "LEFT_ANKLE",
    28: "RIGHT_ANKLE",
    29: "LEFT_PINKY",
    30: "RIGHT_PINKY",
    31: "LEFT_FOOT_INDEX",
    32: "RIGHT_FOOT_INDEX"
}

# --- Cricket Batting Technical Constants ---
IDEAL_ELBOW_RANGE = (155.0, 180.0)    # Optimal degrees for vertical bat drives at impact
CRITICAL_DROPPED_ELBOW = 140.0        # Fault threshold (elbow drops below 140 deg)
MAX_HEAD_STABILITY_DEV = 0.05         # Max standard deviation of normalized coordinate shifts

# --- Advanced Biomechanical Thresholds ---
IDEAL_XFACTOR_RANGE = (15.0, 25.0)       # Optimal degrees of hip-shoulder separation
IDEAL_KNEE_BRACE_RANGE = (170.0, 180.0)  # Fully braced front leg
CRITICAL_KNEE_COLLAPSE = 150.0            # Below this = energy leak
MAX_COM_LATERAL_SWAY = 0.03              # Normalized units (approx 5cm on 1000px grid)
MAX_BACKLIFT_LOOP = 0.06                 # Normalized horizontal deviation

