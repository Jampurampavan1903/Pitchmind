import cv2
import json
import asyncio
import dataclasses
from datetime import datetime
from sqlalchemy import select
from app.models.video import Video
from app.models.analysis import Analysis
from app.core.database import AsyncSessionLocal
from app.services.storage_service import StorageService
from pitchmind_ai.pipeline.batting_pipeline import BattingPipeline
from pitchmind_ai.pipeline.config import PipelineConfig

# In-memory global progress broker for V1 dashboard status updates
# Format: { "video_id": { "status": "processing", "progress_pct": 40.0, "current_step": "pose_estimation" } }
PROGRESS_STORE = {}

def run_analysis_and_save_visuals(video_path: str, video_id: str, storage: StorageService, progress_callback):
    """
    Synchronous worker method executing CPU-bound pose inference and disk I/O.
    Runs entirely within the asyncio ThreadPoolExecutor.
    """
    pipeline = BattingPipeline()
    
    # 1. Trigger the pure Python AI Pipeline
    result = pipeline.analyze(
        video_path=video_path,
        video_id=video_id,
        progress_callback=progress_callback
    )
    
    # 2. Write keyframes to disk as browser JPEGs
    progress_callback(80.0, "saving_visuals")
    for idx, frame in enumerate(result.frames):
        # Encode NumPy BGR image array to JPEG bytes
        ret, jpeg_buffer = cv2.imencode(".jpg", frame.image)
        if ret:
            jpeg_bytes = jpeg_buffer.tobytes()
            # Save frame under storage/frames/{video_id}/frame_NNNN.jpg
            storage.save_frame(video_id, frame.index, jpeg_bytes)
            
    return result

async def process_video_task(video_id: str, storage: StorageService):
    """
    Executes the heavy computer vision and biomechanical analysis pipeline asynchronously.
    Acts as the single bridge separating web layers and ML computation.
    """
    # Fetch database session inside worker context to ensure independent lifecycle
    async with AsyncSessionLocal() as db:
        video_query = await db.execute(select(Video).where(Video.id == video_id))
        db_video = video_query.scalars().first()
        
        analysis_query = await db.execute(select(Analysis).where(Analysis.video_id == video_id))
        db_analysis = analysis_query.scalars().first()
        
        if not db_video or not db_analysis:
            return
            
        video_file_path = db_video.file_path
        
        # Update status to processing
        db_video.status = "processing"
        db_analysis.status = "processing"
        await db.commit()
        
        # Initialize in-memory progress tracker
        PROGRESS_STORE[video_id] = {
            "status": "processing",
            "progress_pct": 10.0,
            "current_step": "extracting_frames"
        }
        
        def on_pipeline_progress(pct: float, step: str):
            """Pipeline callback to broker in-memory status maps for real-time WebSockets."""
            PROGRESS_STORE[video_id] = {
                "status": "processing",
                "progress_pct": pct,
                "current_step": step
            }
            
        try:
            # Run heavy CPU-bound code and frame saving in a separate thread pool executor
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                None,
                run_analysis_and_save_visuals,
                video_file_path,
                video_id,
                storage,
                on_pipeline_progress
            )
            
            # 3. Serialize Python Dataclasses to SQL JSON Text strings
            on_pipeline_progress(95.0, "saving_results")
            
            metrics_dict = dataclasses.asdict(result.metrics)
            landmarks_list = [dataclasses.asdict(l) for l in result.landmarks]
            coaching_list = [dataclasses.asdict(c) for c in result.coaching]
            deliveries_list = []
            if result.deliveries:
                for d in result.deliveries:
                    d_metrics = dataclasses.asdict(d.metrics)
                    deliveries_list.append({
                        "delivery_index": d.delivery_index,
                        "frame_range": list(d.frame_range),
                        "metrics": d_metrics,
                        "coaching": [dataclasses.asdict(c) for c in d.coaching],
                        "landmarks": [dataclasses.asdict(l) for l in d.landmarks]
                    })
            
            # Re-fetch models within active transaction context to avoid detachment states
            video_query = await db.execute(select(Video).where(Video.id == video_id))
            db_video = video_query.scalars().first()
            analysis_query = await db.execute(select(Analysis).where(Analysis.video_id == video_id))
            db_analysis = analysis_query.scalars().first()

            db_analysis.metrics_json = json.dumps(metrics_dict)
            db_analysis.landmarks_json = json.dumps(landmarks_list)
            db_analysis.deliveries_json = json.dumps(deliveries_list)
            
            # 🆕 Run Claude Cognitive Synthesis on calculated metrics
            on_pipeline_progress(97.0, "generating_ai_coaching")
            try:
                from app.services.claude_service import ClaudeService
                from app.services.openai_service import OpenAIService
                from app.models.user import Profile
                
                stroke_type = metrics_dict.get("stroke_type", "cover_drive")
                
                # Fetch the most recent player profile for personalized summary
                profile_query = await db.execute(select(Profile).order_by(Profile.created_at.desc()).limit(1))
                db_profile = profile_query.scalars().first()
                player_name = db_profile.full_name if db_profile else "Player"
                
                # Generate AI Narrative Coaching Review
                ai_coaching = await ClaudeService.generate_coaching_summary(
                    metrics=metrics_dict,
                    stroke_type=stroke_type,
                    player_name=player_name
                )
                
                # Save generated LLM text as coaching insights
                db_analysis.coaching_json = json.dumps(ai_coaching)
                
                # Synthesize text to spoken audio memo
                spoken_text = ai_coaching.get("paragraph", "")
                if spoken_text:
                    has_audio = await OpenAIService.synthesize_speech(
                        text=spoken_text,
                        analysis_id=db_analysis.id
                    )
                    if has_audio:
                        ai_coaching["has_audio"] = True
                        db_analysis.coaching_json = json.dumps(ai_coaching)
            except Exception as ai_err:
                print(f"[AI SERVICE INTEGRATION ERROR] {str(ai_err)}")
                db_analysis.coaching_json = json.dumps(coaching_list)
            
            # Update database telemetry
            db_video.status = "complete"
            db_video.duration_seconds = result.metadata.processing_time_seconds # Use actual processing time
            db_video.fps = result.metadata.fps
            db_video.resolution = result.metadata.resolution
            
            db_analysis.status = "complete"
            db_analysis.frame_count = len(result.frames)
            db_analysis.processing_time_seconds = result.metadata.processing_time_seconds
            db_analysis.completed_at = datetime.utcnow()
            
            await db.commit()
            
            PROGRESS_STORE[video_id] = {
                "status": "complete",
                "progress_pct": 100.0,
                "current_step": "complete"
            }
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            # Fallback error recovery
            await db.rollback()
            
            try:
                # Re-fetch inside active transaction
                video_query = await db.execute(select(Video).where(Video.id == video_id))
                db_video = video_query.scalars().first()
                analysis_query = await db.execute(select(Analysis).where(Analysis.video_id == video_id))
                db_analysis = analysis_query.scalars().first()
                
                db_video.status = "failed"
                db_analysis.status = "failed"
                db_analysis.error_message = str(e)
                db_analysis.completed_at = datetime.utcnow()
                await db.commit()
            except Exception:
                pass
            
            PROGRESS_STORE[video_id] = {
                "status": "failed",
                "progress_pct": 0.0,
                "current_step": "failed",
                "error_message": str(e)
            }
