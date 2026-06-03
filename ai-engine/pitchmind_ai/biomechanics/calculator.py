from pitchmind_ai.models.landmarks import FrameLandmarks
from pitchmind_ai.models.metrics import BattingMetrics
from pitchmind_ai.biomechanics.elbow import ElbowAnalyzer
from pitchmind_ai.biomechanics.head import HeadAnalyzer
from pitchmind_ai.biomechanics.stance import StanceAnalyzer
from pitchmind_ai.biomechanics.footwork import FootworkAnalyzer
from pitchmind_ai.biomechanics.hip_shoulder import HipShoulderAnalyzer
from pitchmind_ai.biomechanics.knee import KneeAnalyzer
from pitchmind_ai.biomechanics.wrist import WristAnalyzer
from pitchmind_ai.biomechanics.centre_of_mass import CentreOfMassAnalyzer
from pitchmind_ai.biomechanics.backlift import BackliftAnalyzer

# PitchMind V1.2 Imports
from pitchmind_ai.biomechanics.timing import TimingAnalyzer
from pitchmind_ai.biomechanics.sweet_spot import SweetSpotAnalyzer
from pitchmind_ai.biomechanics.tactical_advisor import TacticalAdvisor
from pitchmind_ai.biomechanics.length_judging import LengthJudgingAnalyzer
from pitchmind_ai.biomechanics.shot_classifier import ShotClassifier # 🆕 Advanced classifier
from pitchmind_ai.biomechanics.kinetic_chain import KineticChainAnalyzer # 🆕 V0.4 Kinematic Sequencer

class BiomechanicsCalculator:
    """Orchestrates all joint coordinate metrics calculations and dynamic stroke classification."""
    
    def __init__(self):
        self.elbow_analyzer = ElbowAnalyzer()
        self.head_analyzer = HeadAnalyzer()
        self.stance_analyzer = StanceAnalyzer()
        self.footwork_analyzer = FootworkAnalyzer()
        self.hip_shoulder_analyzer = HipShoulderAnalyzer()
        self.knee_analyzer = KneeAnalyzer()
        self.wrist_analyzer = WristAnalyzer()
        self.com_analyzer = CentreOfMassAnalyzer()
        self.backlift_analyzer = BackliftAnalyzer()
        self.timing_analyzer = TimingAnalyzer()
        self.sweet_spot_analyzer = SweetSpotAnalyzer()
        self.tactical_advisor = TacticalAdvisor()
        self.length_judging_analyzer = LengthJudgingAnalyzer()
        self.shot_classifier = ShotClassifier()
        self.kinetic_chain_analyzer = KineticChainAnalyzer()

    def calculate(self, landmarks_sequence: list[FrameLandmarks], is_left_handed: bool = False) -> BattingMetrics:
        """
        Coordinates calculations across all joint tracking dimensions.
        Automatically classifies the shot type and adjusts scoring rules.
        """
        # Execute biomechanical analyzers
        elbow_metrics = self.elbow_analyzer.analyze(landmarks_sequence, is_left_handed)
        head_metrics = self.head_analyzer.analyze(landmarks_sequence)
        stance_metrics = self.stance_analyzer.analyze(landmarks_sequence)
        footwork_metrics = self.footwork_analyzer.analyze(landmarks_sequence, is_left_handed)
        
        # Determine stroke type dynamically to pass down context to wrist analyzer
        stroke_type, stroke_name = self.shot_classifier.classify(landmarks_sequence, is_left_handed)
                    
        # Execute remaining analyzers with stroke-specific context where needed
        hip_shoulder_metrics = self.hip_shoulder_analyzer.analyze(landmarks_sequence, is_left_handed)
        knee_metrics = self.knee_analyzer.analyze(landmarks_sequence, is_left_handed, stroke_type)
        wrist_metrics = self.wrist_analyzer.analyze(landmarks_sequence, is_left_handed, stroke_type)
        com_metrics = self.com_analyzer.analyze(landmarks_sequence)
        backlift_metrics = self.backlift_analyzer.analyze(landmarks_sequence, is_left_handed)
        
        # PitchMind V1.2 Feature Execution
        timing_metrics = self.timing_analyzer.analyze(landmarks_sequence, is_left_handed)
        contact_metrics = self.sweet_spot_analyzer.analyze(landmarks_sequence, is_left_handed)
        tactical_alternatives = self.tactical_advisor.analyze(
            stroke_type, 
            contact_metrics.lateral_deviation_cm, 
            contact_metrics.height_deviation_cm
        )
        length_judging_metrics = self.length_judging_analyzer.analyze(
            stroke_type, 
            footwork_metrics.stride_length_px, 
            footwork_metrics.stride_ratio
        )
        kinetic_chain_metrics = self.kinetic_chain_analyzer.analyze(landmarks_sequence, is_left_handed)

        
        # Footwork timing sync utility score (0-100)
        footwork_sync_score = min(100.0, max(0.0, 100.0 - abs(footwork_metrics.timing_delay_ms - 80.0) * 0.3))
        
        # Blend scores dynamically based on the identified stroke profile
        if stroke_type == "pull_shot":
            overall_score = (
                elbow_metrics.stability_score * 0.15 +
                head_metrics.stability_score * 0.15 +
                stance_metrics.balance_score * 0.10 +
                footwork_sync_score * 0.05 +
                hip_shoulder_metrics.power_score * 0.15 +
                knee_metrics.brace_score * 0.05 +
                wrist_metrics.control_score * 0.15 +
                com_metrics.balance_score * 0.10 +
                backlift_metrics.backlift_score * 0.10
            )
        elif stroke_type == "cut_shot":
            overall_score = (
                elbow_metrics.stability_score * 0.15 +
                head_metrics.stability_score * 0.15 +
                stance_metrics.balance_score * 0.10 +
                footwork_sync_score * 0.05 +
                hip_shoulder_metrics.power_score * 0.10 +
                knee_metrics.brace_score * 0.05 +
                wrist_metrics.control_score * 0.15 +
                com_metrics.balance_score * 0.10 +
                backlift_metrics.backlift_score * 0.15
            )
        elif stroke_type == "sweep_shot":
            overall_score = (
                elbow_metrics.stability_score * 0.15 +
                head_metrics.stability_score * 0.15 +
                stance_metrics.balance_score * 0.10 +
                footwork_sync_score * 0.05 +
                hip_shoulder_metrics.power_score * 0.10 +
                knee_metrics.brace_score * 0.10 +
                wrist_metrics.control_score * 0.15 +
                com_metrics.balance_score * 0.10 +
                backlift_metrics.backlift_score * 0.10
            )
        else:
            # Default Cover Drive
            overall_score = (
                elbow_metrics.stability_score * 0.20 +
                head_metrics.stability_score * 0.15 +
                stance_metrics.balance_score * 0.10 +
                footwork_sync_score * 0.10 +
                hip_shoulder_metrics.power_score * 0.10 +
                knee_metrics.brace_score * 0.10 +
                wrist_metrics.control_score * 0.05 +
                com_metrics.balance_score * 0.10 +
                backlift_metrics.backlift_score * 0.10
            )
            
        # Force strict 0-100 boundaries
        overall_score = max(0.0, min(100.0, overall_score))
        
        return BattingMetrics(
            elbow=elbow_metrics,
            head=head_metrics,
            stance=stance_metrics,
            footwork=footwork_metrics,
            hip_shoulder=hip_shoulder_metrics,
            knee=knee_metrics,
            wrist=wrist_metrics,
            centre_of_mass=com_metrics,
            backlift=backlift_metrics,
            timing=timing_metrics,
            contact=contact_metrics,
            tactical_alternatives=tactical_alternatives,
            length_judging=length_judging_metrics,
            kinetic_chain=kinetic_chain_metrics,
            overall_score=float(overall_score),
            stroke_type=stroke_type,
            stroke_name=stroke_name
        )
