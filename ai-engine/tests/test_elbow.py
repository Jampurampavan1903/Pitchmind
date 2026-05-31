from pitchmind_ai.models.landmarks import FrameLandmarks, Landmark
from pitchmind_ai.biomechanics.elbow import ElbowAnalyzer

def test_elbow_analyzer_optimal_extension():
    """Verify that a straight front arm gets a 100 stability score and flags no flaw."""
    # Joint configuration in near-straight extension (170 degrees)
    shoulder = Landmark(x=0.5, y=0.2, z=0.0, visibility=1.0)
    elbow = Landmark(x=0.5, y=0.4, z=0.0, visibility=1.0)
    # wrist shifted slightly to create 170 deg extension
    wrist = Landmark(x=0.465, y=0.6, z=0.0, visibility=1.0)
    
    frame = FrameLandmarks(
        frame_index=0,
        timestamp_ms=0.0,
        landmarks={
            "LEFT_SHOULDER": shoulder,
            "LEFT_ELBOW": elbow,
            "LEFT_WRIST": wrist
        },
        confidence=1.0
    )
    
    analyzer = ElbowAnalyzer()
    metrics = analyzer.analyze([frame])
    
    assert metrics.is_dropped_elbow is False
    assert metrics.stability_score == 100.0
    assert metrics.min_impact_angle > 155.0

def test_elbow_analyzer_critical_drop():
    """Verify that a heavily bent front elbow triggers dropped elbow and deducts score."""
    # Joint configuration at right angle (90 degrees) - severe technical flaw
    shoulder = Landmark(x=0.5, y=0.2, z=0.0, visibility=1.0)
    elbow = Landmark(x=0.5, y=0.4, z=0.0, visibility=1.0)
    wrist = Landmark(x=0.7, y=0.4, z=0.0, visibility=1.0)
    
    frame = FrameLandmarks(
        frame_index=0,
        timestamp_ms=0.0,
        landmarks={
            "LEFT_SHOULDER": shoulder,
            "LEFT_ELBOW": elbow,
            "LEFT_WRIST": wrist
        },
        confidence=1.0
    )
    
    analyzer = ElbowAnalyzer()
    metrics = analyzer.analyze([frame])
    
    assert metrics.is_dropped_elbow is True
    assert metrics.stability_score < 50.0 # High penalty for 90 deg drop
    assert metrics.min_impact_angle == 90.0
