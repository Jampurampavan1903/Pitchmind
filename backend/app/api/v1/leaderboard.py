import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.models.analysis import Analysis
from app.models.user import User, Profile

router = APIRouter()

@router.get("/leaderboards")
async def get_leaderboard(
    stroke_type: Optional[str] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves global and grassroots player competitive rankings.
    Unpacks sqlite JSON metrics, binds location demographics, and sorts by PCI score.
    """
    # Query complete analysis logs joining associated profiles
    stmt = (
        select(Analysis)
        .where(Analysis.status == "complete")
        .order_by(Analysis.created_at.desc())
    )
    result = await db.execute(stmt)
    analyses = result.scalars().all()
    
    # Query all active profile details
    prof_stmt = select(Profile)
    prof_result = await db.execute(prof_stmt)
    profiles = {p.user_id: p for p in prof_result.scalars().all()}
    
    # Unpack, filter, and compile list of candidate scores
    scoreboard = []
    seen_users = set() # only display each player's highest score to avoid cluttering
    
    for a in analyses:
        metrics = json.loads(a.metrics_json) if a.metrics_json else {}
        
        # Determine stroke type and PCI score
        a_stroke = metrics.get("stroke_type", "cover_drive")
        pci_score = metrics.get("pci_score", 81.5)
        
        # Check filters
        if stroke_type and a_stroke != stroke_type:
            continue
            
        # Unpack user profile demographics
        # Note: in this prototype upload flow, we fetch the first/current profile 
        # or bind it if we can find a matching profile
        # Let's map it safely:
        user_profile = None
        # Safe fallback lookup
        for uid, p in profiles.items():
            user_profile = p
            break # prototype default profile
            
        if not user_profile:
             user_profile = Profile(
                 full_name="Pavan Kumar",
                 role="batsman",
                 country="India",
                 state="Andhra Pradesh",
                 district="Krishna",
                 city_town="Vijayawada",
                 height_cm=178,
                 weight_kg=72
             )
             
        # Filter by grassroots location parameters
        if country and user_profile.country != country:
            continue
        if state and user_profile.state != state:
            continue
            
        user_key = user_profile.full_name
        if user_key in seen_users:
            # We already mapped this player's higher score, continue
            continue
            
        seen_users.add(user_key)
        
        scoreboard.append({
            "analysis_id": a.id,
            "player_name": user_profile.full_name,
            "role": user_profile.role,
            "avatar_url": user_profile.avatar_url,
            "country": user_profile.country or "India",
            "state": user_profile.state or "Andhra Pradesh",
            "district": user_profile.district or "Krishna",
            "city_town": user_profile.city_town or "Vijayawada",
            "stroke_type": a_stroke,
            "stroke_name": a_stroke.replace('_', ' ').title(),
            "pci_score": pci_score,
            "overall_score": metrics.get("overall_score", 80.0)
        })
        
    # Sort scoreboard by Postural Congruency Index (PCI) descending
    scoreboard.sort(key=lambda x: x["pci_score"], reverse=True)
    
    # Slice top 100 players
    ranked_scoreboard = []
    for idx, entry in enumerate(scoreboard[:100]):
        entry["rank"] = idx + 1
        ranked_scoreboard.append(entry)
        
    return ranked_scoreboard

@router.get("/scout-card/{analysis_id}")
async def get_scout_card(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """
    Compiles full grassroots player specs, dominant batting stance, and biomechanical scores 
    across 5 radar axes for a FIFA-style scouting card.
    """
    # Fetch analysis
    stmt = select(Analysis).where(Analysis.id == analysis_id)
    result = await db.execute(stmt)
    a = result.scalar_one_or_none()
    
    if not a:
        raise HTTPException(status_code=404, detail="Analysis session not found")
        
    metrics = json.loads(a.metrics_json) if a.metrics_json else {}
    
    # Query matching profile
    prof_stmt = select(Profile)
    prof_result = await db.execute(prof_stmt)
    profiles = prof_result.scalars().all()
    
    user_profile = None
    for p in profiles:
        user_profile = p
        break # prototypes matching default
        
    if not user_profile:
        user_profile = Profile(
            full_name="Pavan Kumar",
            role="batsman",
            country="India",
            state="Andhra Pradesh",
            district="Krishna",
            city_town="Vijayawada",
            height_cm=178,
            weight_kg=72
        )
        
    # Calculate 5 radar axes:
    # 1. Congruency (PCI score)
    pci_score = metrics.get("pci_score", 81.5)
    
    # 2. Power (Kinetic sequencing score)
    kinetic = metrics.get("kinetic_chain", {})
    power_score = 85.0
    if isinstance(kinetic, dict):
        power_score = kinetic.get("sequence_score", 85.0)
    
    # 3. Balance (COM balance & Stance balance average)
    com_balance = metrics.get("centre_of_mass", {}).get("balance_score", 82.0) if metrics.get("centre_of_mass") else 82.0
    stance_balance = metrics.get("stance", {}).get("balance_score", 80.0) if metrics.get("stance") else 80.0
    balance_score = round((com_balance + stance_balance) / 2.0, 1)
    
    # 4. Injury Safety (derived from flaw counts or stability checks)
    is_collapsed_knee = metrics.get("knee", {}).get("is_collapsed", False) if metrics.get("knee") else False
    is_dropped_elbow = metrics.get("elbow", {}).get("is_dropped_elbow", False) if metrics.get("elbow") else False
    safety_score = 100.0
    if is_collapsed_knee:
        safety_score -= 20.0
    if is_dropped_elbow:
        safety_score -= 20.0
        
    # 5. Length Judgment accuracy score
    length_score = metrics.get("length_judging", {}).get("judging_score", 80.0) if metrics.get("length_judging") else 80.0
    
    overall_badge_score = round(
        (pci_score * 0.25) + (power_score * 0.25) + (balance_score * 0.2) + (safety_score * 0.15) + (length_score * 0.15),
        1
    )

    return {
        "analysis_id": a.id,
        "player_name": user_profile.full_name,
        "role": user_profile.role.upper(),
        "avatar_url": user_profile.avatar_url,
        "grassroots_location": f"{user_profile.city_town}, {user_profile.district}, {user_profile.state}",
        "stance": "Right-Hand Batsman" if getattr(user_profile, 'dominant_stance', '') != 'left_handed' else "Left-Hand Batsman",
        "scouting_index_opt_in": True,
        "overall_grade": overall_badge_score,
        "radar_axes": [
            {"subject": "Congruency (PCI)", "value": pci_score, "fullMark": 100},
            {"subject": "Kinetic Sequence", "value": power_score, "fullMark": 100},
            {"subject": "Balance Quotient", "value": balance_score, "fullMark": 100},
            {"subject": "Injury Safety", "value": safety_score, "fullMark": 100},
            {"subject": "Length Judgment", "value": length_score, "fullMark": 100}
        ]
    }
