import time
from datetime import datetime
from typing import Callable, Optional
from pitchmind_ai.models.results import BattingAnalysisResult, AnalysisMetadata, DeliveryResult
from pitchmind_ai.extractors.frame_extractor import FrameExtractor
from pitchmind_ai.extractors.delivery_segmenter import DeliverySegmenter
from pitchmind_ai.pose.estimator import PoseEstimator
from pitchmind_ai.biomechanics.calculator import BiomechanicsCalculator
from pitchmind_ai.coaching.engine import CoachingEngine

class BattingPipeline:
    """The master coordinator for PitchMind's cricket video analysis computational pipeline."""
    
    def __init__(self):
        self.frame_extractor = FrameExtractor()
        self.delivery_segmenter = DeliverySegmenter()
        self.biomechanics_calculator = BiomechanicsCalculator()
        self.coaching_engine = CoachingEngine()

    def analyze(
        self, 
        video_path: str, 
        video_id: str = "demo-video",
        sample_rate: int = 5,
        is_left_handed: bool = False,
        progress_callback: Optional[Callable[[float, str], None]] = None
    ) -> BattingAnalysisResult:
        """
        Coordinates the entire processing pipeline:
        Video File -> Frame Extraction -> Pose Estimation -> Delivery Segmentation -> Biomechanics -> Coaching -> Payload
        """
        start_time = time.time()
        
        # Stage 1: Frame Extraction
        if progress_callback:
            progress_callback(10.0, "extracting_frames")
            
        metadata = self.frame_extractor.get_video_metadata(video_path)
        frames = self.frame_extractor.extract(video_path, sample_rate=sample_rate)
        
        # Stage 2: Pose Estimation
        if progress_callback:
            progress_callback(40.0, "pose_estimation")
            
        pose_estimator = PoseEstimator()
        try:
            landmarks_sequence = pose_estimator.estimate(frames)
        finally:
            pose_estimator.close()
            
        # Stage 3: Delivery Segmentation
        if progress_callback:
            progress_callback(60.0, "segmenting_deliveries")
            
        segments = self.delivery_segmenter.segment(landmarks_sequence)
        
        # Stage 4: Biomechanical Calculations & Coaching Insights per Delivery
        if progress_callback:
            progress_callback(75.0, "calculating_metrics")
            
        deliveries = []
        for idx, (start_idx, end_idx) in enumerate(segments):
            # Slice landmarks, frames for this specific delivery
            delivery_landmarks = landmarks_sequence[start_idx:end_idx + 1]
            delivery_frames = frames[start_idx:end_idx + 1]
            
            # Calculate biomechanical metrics for this delivery
            delivery_metrics = self.biomechanics_calculator.calculate(delivery_landmarks, is_left_handed)
            
            # Synthesize coaching insights for this delivery
            delivery_insights = self.coaching_engine.generate_insights(delivery_metrics)
            
            deliveries.append(DeliveryResult(
                delivery_index=idx,
                frame_range=(start_idx, end_idx),
                frames=delivery_frames,
                landmarks=delivery_landmarks,
                metrics=delivery_metrics,
                coaching=delivery_insights
            ))

        # Backward compatibility: set top-level metrics/coaching from the first delivery
        primary_metrics = deliveries[0].metrics if deliveries else None
        primary_insights = deliveries[0].coaching if deliveries else []
        
        # Stage 5: Compile Final Payload
        if progress_callback:
            progress_callback(100.0, "complete")
            
        processing_time = time.time() - start_time
        
        analysis_metadata = AnalysisMetadata(
            fps=metadata["fps"],
            frame_count=len(frames),
            resolution=metadata["resolution"],
            processing_time_seconds=float(processing_time),
            created_at=datetime.utcnow()
        )
        
        return BattingAnalysisResult(
            video_id=video_id,
            frames=frames,
            landmarks=landmarks_sequence,
            metrics=primary_metrics,
            coaching=primary_insights,
            metadata=analysis_metadata,
            deliveries=deliveries
        )
