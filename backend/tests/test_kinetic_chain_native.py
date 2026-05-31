import unittest
import sys
import os

# Append project root to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pitchmind_ai.models.landmarks import FrameLandmarks, Landmark
from pitchmind_ai.biomechanics.kinetic_chain import KineticChainAnalyzer

class TestKineticChainNative(unittest.TestCase):
    
    def test_kinetic_chain_fallback_short_sequence(self):
        """
        Verifies fallback triggers correctly on short sequences.
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
        
        self.assertEqual(metrics.sequence_score, 90.0)
        self.assertFalse(metrics.is_out_of_order)
        self.assertEqual(len(metrics.segments), 4)
        
        names = [s.segment_name for s in metrics.segments]
        self.assertTrue("Hip Rotation" in names)
        self.assertTrue("Shoulder Rotation" in names)
        self.assertTrue("Elbow Extension" in names)
        self.assertTrue("Wrist Rollover" in names)

    def test_kinetic_chain_math_evaluation(self):
        """
        Verifies velocity peaks are captured and metrics are correctly formatted.
        """
        analyzer = KineticChainAnalyzer()
        
        # Create 20 mock frames simulating a downswing sequence
        landmarks_seq = []
        for idx in range(20):
            joints = {
                "LEFT_HIP": Landmark(0.5, 0.5, 0.0, 0.95),
                "RIGHT_HIP": Landmark(0.4, 0.5, 0.0, 0.95),
                "LEFT_SHOULDER": Landmark(0.52, 0.3, 0.0, 0.95),
                "RIGHT_SHOULDER": Landmark(0.38, 0.3, 0.0, 0.95),
                "LEFT_ELBOW": Landmark(0.58, 0.38, 0.0, 0.95),
                "LEFT_WRIST": Landmark(0.62, 0.45, 0.0, 0.95),
                "LEFT_INDEX": Landmark(0.64, 0.48, 0.0, 0.95)
            }
            
            t = idx * 33.3
            landmarks_seq.append(FrameLandmarks(
                frame_index=idx,
                timestamp_ms=t,
                landmarks=joints,
                confidence=0.95
            ))
            
        metrics = analyzer.analyze(landmarks_seq, is_left_handed=False)
        
        self.assertTrue(isinstance(metrics.sequence_score, float))
        self.assertTrue(isinstance(metrics.is_out_of_order, bool))
        self.assertTrue(isinstance(metrics.power_leaks, list))
        self.assertEqual(len(metrics.segments), 4)
        
        for s in metrics.segments:
            self.assertTrue(s.peak_velocity >= 0.0)
            self.assertTrue(s.peak_timestamp_ms >= 0.0)
            self.assertTrue(s.sequence_rank in [1, 2, 3, 4])

if __name__ == "__main__":
    unittest.main()
