import pytest
from pitchmind_ai.models.landmarks import FrameLandmarks, Landmark
from pitchmind_ai.biomechanics.head import HeadAnalyzer
from pitchmind_ai.biomechanics.stance import StanceAnalyzer
from pitchmind_ai.biomechanics.footwork import FootworkAnalyzer

def test_head_analyzer_stable():
    """Verify that a steady head gives a high stability score with minimal tilt."""
    frames = []
    # Stable NOSE and shoulders across 5 frames
    for i in range(5):
        frames.append(FrameLandmarks(
            frame_index=i,
            timestamp_ms=float(i * 100.0),
            landmarks={
                "NOSE": Landmark(x=0.5, y=0.15 + (i * 0.001), z=0.0, visibility=1.0),
                "LEFT_SHOULDER": Landmark(x=0.3, y=0.25, z=0.0, visibility=1.0),
                "RIGHT_SHOULDER": Landmark(x=0.7, y=0.25, z=0.0, visibility=1.0)
            },
            confidence=1.0
        ))
        
    analyzer = HeadAnalyzer()
    metrics = analyzer.analyze(frames)
    
    assert metrics.movement_std_dev_px < 5.0
    assert metrics.eye_level_tilt_degrees == 0.0
    assert metrics.stability_score > 90.0

def test_head_analyzer_unstable():
    """Verify that excessive head sway and shoulder tilt penalize stability."""
    frames = []
    # Swaying NOSE and tilting shoulders
    for i in range(5):
        tilt_offset = 0.02 * i
        frames.append(FrameLandmarks(
            frame_index=i,
            timestamp_ms=float(i * 100.0),
            landmarks={
                "NOSE": Landmark(x=0.5 + (i * 0.015), y=0.15, z=0.0, visibility=1.0),
                "LEFT_SHOULDER": Landmark(x=0.3, y=0.25 - tilt_offset, z=0.0, visibility=1.0),
                "RIGHT_SHOULDER": Landmark(x=0.7, y=0.25 + tilt_offset, z=0.0, visibility=1.0)
            },
            confidence=1.0
        ))
        
    analyzer = HeadAnalyzer()
    metrics = analyzer.analyze(frames)
    
    assert metrics.movement_std_dev_px > 10.0
    assert metrics.eye_level_tilt_degrees > 5.0
    assert metrics.stability_score < 75.0

def test_stance_analyzer_optimal():
    """Verify that a standard balanced stance calculates optimal ratio and score."""
    shoulder_ls = Landmark(x=0.4, y=0.25, z=0.0, visibility=1.0)
    shoulder_rs = Landmark(x=0.6, y=0.25, z=0.0, visibility=1.0)
    
    # 1.2x shoulder width stance, perfect center-of-mass balance (hips center = ankles center = 0.5)
    ankle_la = Landmark(x=0.38, y=0.8, z=0.0, visibility=1.0)
    ankle_ra = Landmark(x=0.62, y=0.8, z=0.0, visibility=1.0)
    
    hip_lh = Landmark(x=0.45, y=0.5, z=0.0, visibility=1.0)
    hip_rh = Landmark(x=0.55, y=0.5, z=0.0, visibility=1.0)
    
    frame = FrameLandmarks(
        frame_index=0,
        timestamp_ms=0.0,
        landmarks={
            "LEFT_SHOULDER": shoulder_ls,
            "RIGHT_SHOULDER": shoulder_rs,
            "LEFT_ANKLE": ankle_la,
            "RIGHT_ANKLE": ankle_ra,
            "LEFT_HIP": hip_lh,
            "RIGHT_HIP": hip_rh
        },
        confidence=1.0
    )
    
    analyzer = StanceAnalyzer()
    metrics = analyzer.analyze([frame])
    
    assert 1.0 <= metrics.width_to_shoulder_ratio <= 1.3
    assert metrics.balance_score == 100.0

def test_footwork_analyzer_delay():
    """Verify dynamic stride calculation and timing delay sync offsets."""
    frames = []
    # 5 frames: foot starts narrow, dynamic stride peaks at frame 2, elbow swing reaches max extension at frame 4
    for i in range(5):
        # Ankles reach peak distance at frame 2 (timestamp 200.0)
        la_x = 0.45 if i < 2 else (0.35 if i == 2 else 0.38)
        ra_x = 0.55 if i < 2 else (0.65 if i == 2 else 0.62)
        
        # Lead elbow reaches peak flexion/minimum angle at frame 4 (timestamp 400.0)
        # For right-handed batter, lead arm is LEFT. Shoulder=0.5, Elbow=0.5, Wrist variable.
        wrist_x = 0.5 if i != 4 else 0.65 # Flexes elbow at frame 4
        
        frames.append(FrameLandmarks(
            frame_index=i,
            timestamp_ms=float(i * 100.0),
            landmarks={
                "LEFT_ANKLE": Landmark(x=la_x, y=0.8, z=0.0, visibility=1.0),
                "RIGHT_ANKLE": Landmark(x=ra_x, y=0.8, z=0.0, visibility=1.0),
                "LEFT_SHOULDER": Landmark(x=0.5, y=0.2, z=0.0, visibility=1.0),
                "LEFT_ELBOW": Landmark(x=0.5, y=0.4, z=0.0, visibility=1.0),
                "LEFT_WRIST": Landmark(x=wrist_x, y=0.4, z=0.0, visibility=1.0)
            },
            confidence=1.0
        ))
        
    analyzer = FootworkAnalyzer()
    metrics = analyzer.analyze(frames, is_left_handed=False)
    
    # Peak ankle distance: 0.65 - 0.35 = 0.3 * 1000 = 300px
    assert metrics.stride_length_px == pytest.approx(300.0)
    # Stride completed at timestamp 200.0. Impact elbow flexion at timestamp 400.0.
    # Delay = 400.0 - 200.0 = 200.0ms
    assert metrics.timing_delay_ms == pytest.approx(200.0)
