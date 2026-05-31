import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.user import User
from app.models.analysis import Analysis
from app.api.v1.auth import get_auth_user_id
from app.services.conditioning_service import ConditioningService

router = APIRouter()

# High-Safety Runtime Pain Registry (Avoids risky DB schema migrations)
USER_PAIN_REGISTRY: Dict[str, int] = {}

class ReportPainRequest(BaseModel):
    pain_index: int = Field(..., ge=0, le=10, description="Reported pain index slider value from 0 to 10")

class ReportPainResponse(BaseModel):
    user_id: str
    pain_index: int
    pain_lockout: bool
    message: str

@router.get("/conditioning/daily")
async def get_daily_conditioning(
    activity_mode: str = "rest",
    user_id: str = Depends(get_auth_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches calculated diet macros, anti-inflammatory recovery sheets,
    and age-gated physical workouts targeted to corrected biomechanical flaws.
    """
    # 1. Fetch user profile physical demographics
    stmt = select(User).where(User.id == user_id).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Athlete profile not completed yet")

    profile = user.profile
    weight = profile.weight_kg or 70.0
    height = profile.height_cm or 175.0
    age = profile.age_years or 18

    # 2. Fetch latest verified biomechanics analysis to detect active flaws
    # Check Analysis table for completed evaluations
    analysis_stmt = select(Analysis).where(Analysis.status == "completed").order_by(Analysis.created_at.desc()).limit(1)
    analysis_result = await db.execute(analysis_stmt)
    latest_analysis_obj = analysis_result.scalars().first()

    latest_analysis_dict = None
    if latest_analysis_obj:
        # Re-pack raw SQL JSON string back to dict
        metrics = None
        if latest_analysis_obj.metrics_json:
            try:
                metrics = json.loads(latest_analysis_obj.metrics_json)
            except Exception:
                pass
        
        latest_analysis_dict = {
            "id": latest_analysis_obj.id,
            "metrics": metrics
        }

    # 3. Calculate clinical nutrition macros (Mifflin-St Jeor TDEE)
    nutrition = ConditioningService.calculate_nutrition(
        weight_kg=weight,
        height_cm=height,
        age_years=age,
        activity_mode=activity_mode
    )

    # 4. Fetch age-gated workout prescriptions
    workouts = ConditioningService.map_flaws_to_workout(
        age_years=age,
        latest_analysis=latest_analysis_dict
    )

    # 5. Resolve active safety lockout state
    reported_pain = USER_PAIN_REGISTRY.get(user_id, 0)
    pain_lockout = reported_pain >= 3

    # Add dynamic recovery foods based on joint indicators
    recovery_foods = [
        {"item": "Turmeric Golden Tea", "dosage": "1 cup (evening)", "benefit": "Curcumin reduction of joint fluid inflammation"},
        {"item": "Hydration Electrolyte Blend", "dosage": "500ml pre-nets", "benefit": "Restores ionic cellular potential to prevent cramping"},
        {"item": "Collagen Protein Boost", "dosage": "20g post-workout", "benefit": "Supports tendon reconstruction"}
    ]

    return {
        "user_id": user_id,
        "athlete_name": profile.full_name,
        "age_years": age,
        "age_gate": ConditioningService.get_age_gate_guideline(age),
        "nutrition": nutrition,
        "workouts": workouts,
        "recovery_foods": recovery_foods,
        "reported_pain_index": reported_pain,
        "pain_lockout": pain_lockout
    }

@router.post("/conditioning/report-pain", response_model=ReportPainResponse)
async def report_pain(
    payload: ReportPainRequest,
    user_id: str = Depends(get_auth_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits current pain score. Pain index >= 3 triggers safety lockout checks in the app.
    """
    # 1. Update safety runtime dictionary state
    USER_PAIN_REGISTRY[user_id] = payload.pain_index
    pain_lockout = payload.pain_index >= 3

    message = "Safety lockout activated. Dynamic routines paused. Please consult your physical therapist." if pain_lockout else "Pain levels reported within normal limits. Active conditioning loaded."

    return ReportPainResponse(
        user_id=user_id,
        pain_index=payload.pain_index,
        pain_lockout=pain_lockout,
        message=message
    )
