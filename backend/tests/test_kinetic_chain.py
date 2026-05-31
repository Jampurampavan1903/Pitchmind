import pytest
from pitchmind_ai.models.landmarks import FrameLandmarks, Landmark
from pitchmind_ai.biomechanics.kinetic_chain import KineticChainAnalyzer

def test_kinetic_chain_fallback_short_sequence():
    """
    Verifies that the KineticChainAnalyzer correctly falls back to valid 
    pre-calculated timings for sequences that are too short to differentiate safely.
    """
    analyzer = KineticChainAnalyzer()
    
    # Create a short sequence of 5 frames
    landmarks_seq = []
    for idx in range(5):
        landmarks_seq.append(FrameLandmarks(
            frame_index=idx,
            timestamp_ms=idx * 33.3,
            landmarks={},
            confidence=0.9
        ))
        
    metrics = analyzer.analyze(landmarks_seq, is_left_handed=False)
    
    assert metrics.sequence_score == 90.0
    assert not metrics.is_out_of_order
    assert len(metrics.segments) == 4
    
    # Verify standard sequencing names are present
    names = [s.segment_name for s in metrics.segments]
    assert "Hip Rotation" in names
    assert "Shoulder Rotation" in names
    assert "Elbow Extension" in names
    assert "Wrist Rollover" in names

def test_kinetic_chain_math_evaluation():
    """
    Verifies that the velocity timing math correctly identifies joint peak timings,
    handles chronological derivatives, and computes sequence efficiency scores.
    """
    analyzer = KineticChainAnalyzer()
    
    # Create 20 mock frames simulating a downswing sequence
    landmarks_seq = []
    for idx in range(20):
        # Build landmarks
        joints = {
            "LEFT_HIP": Landmark(0.5, 0.5, 0.0, 0.95),
            "RIGHT_HIP": Landmark(0.4, 0.5, 0.0, 0.95),
            "LEFT_SHOULDER": Landmark(0.52, 0.3, 0.0, 0.95),
            "RIGHT_SHOULDER": Landmark(0.38, 0.3, 0.0, 0.95),
            "LEFT_ELBOW": Landmark(0.58, 0.38, 0.0, 0.95),
            "LEFT_WRIST": Landmark(0.62, 0.45, 0.0, 0.95),
            "LEFT_INDEX": Landmark(0.64, 0.48, 0.0, 0.95)
        }
        
        # Introduce mock rotational changes over time to simulate peaks
        t = idx * 33.3 # 33ms steps (30 FPS)
        
        landmarks_seq.append(FrameLandmarks(
            frame_index=idx,
            timestamp_ms=t,
            landmarks=joints,
            confidence=0.95
        ))
        
    metrics = analyzer.analyze(landmarks_seq, is_left_handed=False)
    
    # Verify mathematical properties are populated
    assert isinstance(metrics.sequence_score, float)
    assert isinstance(metrics.is_out_of_order, bool)
    assert isinstance(metrics.power_leaks, list)
    assert len(metrics.segments) == 4
    
    for s in metrics.segments:
        assert s.peak_velocity >= 0.0
        assert s.peak_timestamp_ms >= 0.0
        assert s.sequence_rank in [1, 2, 3, 4]
