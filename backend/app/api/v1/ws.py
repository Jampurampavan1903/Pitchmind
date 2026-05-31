import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.workers.analysis_worker import PROGRESS_STORE

router = APIRouter()

@router.websocket("/ws/{video_id}")
async def websocket_progress_endpoint(websocket: WebSocket, video_id: str):
    """
    Persistent real-time status connection.
    Streams joint evaluation completion updates down to the frontend dashboard.
    """
    await websocket.accept()
    print(f"[WS] Client connected for video: {video_id}")
    
    last_status = None
    last_pct = -1.0
    
    try:
        while True:
            # Look up active worker thread state
            progress = PROGRESS_STORE.get(video_id)
            if progress:
                status = progress["status"]
                pct = progress["progress_pct"]
                step = progress["current_step"]
                err = progress.get("error_message")
                
                # Only send if state actually drifted
                if status != last_status or pct != last_pct:
                    await websocket.send_json({
                        "video_id": video_id,
                        "status": status,
                        "progress_pct": pct,
                        "current_step": step,
                        "error_message": err
                    })
                    last_status = status
                    last_pct = pct
                    
                # Clean exit on terminal boundaries
                if status in ["complete", "failed"]:
                    print(f"[WS] Video {video_id} processing ended with status: {status}")
                    break
            else:
                # Video not yet registered in worker progress store
                await websocket.send_json({
                    "video_id": video_id,
                    "status": "pending",
                    "progress_pct": 0.0,
                    "current_step": "queued"
                })
                
            # Throttle poll to avoid spinning the thread
            await asyncio.sleep(0.5)
            
    except WebSocketDisconnect:
        print(f"[WS] Client disconnected prematurely for video: {video_id}")
    except Exception as e:
        print(f"[WS] WebSocket error for video {video_id}: {str(e)}")
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            # Already closed
            pass
