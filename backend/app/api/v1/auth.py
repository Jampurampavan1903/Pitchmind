import os
import uuid
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User, Profile
from app.services.otp_service import OtpService
from app.schemas.auth import (
    SignupRequest,
    SignupResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    CompleteProfileRequest,
    ProfileResponse,
    UserResponse
)
from app.core.security import create_access_token, decode_access_token
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger("pitchmind.auth")

def get_auth_user_id(authorization: str = Header(..., description="Bearer <jwt_token>")) -> str:
    """Helper dependency to extract and validate the cryptographically signed JWT access token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Use 'Bearer <jwt_token>'")
    token = authorization.split(" ")[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Access token missing")
    return decode_access_token(token)

@router.post("/auth/signup", response_model=SignupResponse)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Starts the sign-up or login flow by validating a phone number or email,
    generating a 6-digit secure OTP, dispatching it via OtpService (SMTP/Twilio),
    printing it to the terminal, and returning a verification ID.
    """
    if not payload.email and not payload.phone_number:
        raise HTTPException(status_code=400, detail="Either email or phone number must be provided")

    # Generate a secure 6-digit OTP code
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Query for existing user
    stmt = select(User).options(selectinload(User.profile))
    if payload.email:
        stmt = stmt.where(User.email == payload.email)
        method = "email"
        target = payload.email
    else:
        stmt = stmt.where(User.phone_number == payload.phone_number)
        method = "phone"
        target = payload.phone_number
        
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if user:
        # Existing user: update OTP code and expiration
        user.otp_code = otp
        user.otp_expires_at = expires_at
        user.updated_at = datetime.utcnow()
    else:
        # New user: register in SQLite
        user = User(
            id=str(uuid.uuid4()),
            email=payload.email,
            phone_number=payload.phone_number,
            is_verified=False,
            otp_code=otp,
            otp_expires_at=expires_at
        )
        db.add(user)
        
    await db.flush()
    
    # Secure Structured Log Output for tracking OTP delivery
    logger.info(f"Generated secure OTP code for target={target}, method={method.upper()}, code={otp}, expires_at={expires_at} (UTC)")
    
    # Dispatch via production-grade OtpService
    success, dispatch_message = await OtpService.send_otp(target, otp, method)
    
    if not success:
         raise HTTPException(status_code=500, detail=f"Failed to deliver verification code: {dispatch_message}")
    
    return SignupResponse(
        verification_id=user.id,
        method=method,
        message=dispatch_message
    )

@router.post("/auth/verify-otp", response_model=VerifyOtpResponse)
async def verify_otp(payload: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Verifies the 6-digit OTP code and authenticates the user session.
    """
    stmt = select(User).where(User.id == payload.verification_id).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Verification session not found")
        
    # Check for bypass or actual verification match
    bypass_enabled = os.getenv("PITCHMIND_OTP_BYPASS_ENABLED", "False").lower() in ("true", "1", "yes")
    is_bypass = bypass_enabled and payload.otp_code == "123456"
    
    is_valid_otp = is_bypass or (user.otp_code == payload.otp_code and user.otp_expires_at and datetime.utcnow() < user.otp_expires_at)
    
    if not is_valid_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")
        
    # Successfully verified: mark user as active/verified
    user.is_verified = True
    user.otp_code = None # Consume the OTP code
    user.otp_expires_at = None
    
    await db.flush()
    
    # Generate real signed JWT token for production security
    jwt_token = create_access_token(user.id)
    logger.info(f"Successfully verified OTP. Generated signed JWT token for user_id={user.id}")
    
    return VerifyOtpResponse(
        access_token=jwt_token,
        is_verified=True,
        user_id=user.id,
        has_profile=(user.profile is not None)
    )



@router.post("/auth/complete-profile", response_model=ProfileResponse)
async def complete_profile(
    payload: CompleteProfileRequest,
    user_id: str = Depends(get_auth_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Completes registration by binding a full name and selecting the user's athletic focus role:
    batsman, bowler, wicket_keeper, or coach.
    """
    # Verify role domain
    if payload.role not in ["batsman", "bowler", "wicket_keeper", "coach"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'batsman', 'bowler', 'wicket_keeper', or 'coach'")
        
    stmt = select(User).where(User.id == user_id).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
        
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="User must be verified before completing profile")
        
    profile = user.profile
    if profile:
        # Update existing profile
        profile.full_name = payload.full_name
        profile.role = payload.role
        profile.avatar_url = payload.avatar_url
        
        # 🆕 Location & Physical specs
        profile.height_cm = payload.height_cm
        profile.weight_kg = payload.weight_kg
        profile.age_years = payload.age_years if payload.age_years is not None else 18
        profile.dominant_hand = payload.dominant_hand
        profile.country = payload.country
        profile.state = payload.state
        profile.district = payload.district
        profile.city_town = payload.city_town
        profile.scout_opt_in = payload.scout_opt_in
        
        profile.updated_at = datetime.utcnow()
    else:
        # Create new profile
        profile = Profile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            full_name=payload.full_name,
            role=payload.role,
            avatar_url=payload.avatar_url,
            
            # 🆕 Location & Physical specs
            height_cm=payload.height_cm,
            weight_kg=payload.weight_kg,
            age_years=payload.age_years if payload.age_years is not None else 18,
            dominant_hand=payload.dominant_hand,
            country=payload.country,
            state=payload.state,
            district=payload.district,
            city_town=payload.city_town,
            scout_opt_in=payload.scout_opt_in
        )
        db.add(profile)
        
    await db.flush()
    
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        full_name=profile.full_name,
        role=profile.role,
        avatar_url=profile.avatar_url,
        
        # 🆕 Location & Physical specs
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        age_years=profile.age_years,
        dominant_hand=profile.dominant_hand,
        country=profile.country,
        state=profile.state,
        district=profile.district,
        city_town=profile.city_town,
        scout_opt_in=profile.scout_opt_in
    )

@router.get("/auth/me", response_model=UserResponse)
async def get_me(
    user_id: str = Depends(get_auth_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves metadata and role profiles of the currently logged-in user session."""
    stmt = select(User).where(User.id == user_id).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    return user

from sqlalchemy import delete
from app.models.video import Video
from app.models.analysis import Analysis

@router.post("/auth/reset-database")
async def reset_database(db: AsyncSession = Depends(get_db)):
    """Deletes all analysis logs and uploaded videos from the database to allow a fresh calibration start."""
    try:
        await db.execute(delete(Analysis))
        await db.execute(delete(Video))
        await db.commit()
        return {"status": "success", "message": "Database sessions flushed cleanly"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset SQLite database: {str(e)}")
