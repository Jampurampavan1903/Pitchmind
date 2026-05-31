from pydantic import BaseModel, Field
from typing import Optional

class SignupRequest(BaseModel):
    email: Optional[str] = Field(None, description="User Gmail address")
    phone_number: Optional[str] = Field(None, description="User mobile phone number (any country)")

class SignupResponse(BaseModel):
    verification_id: str = Field(..., description="Active session verification ID")
    method: str = Field(..., description="Method used: 'email' or 'phone'")
    message: str = Field(..., description="Dynamic instructions description")

class VerifyOtpRequest(BaseModel):
    verification_id: str = Field(..., description="Active session verification ID")
    otp_code: str = Field(..., description="6-digit OTP code")

class VerifyOtpResponse(BaseModel):
    access_token: str = Field(..., description="Session authorization token")
    is_verified: bool = Field(..., description="Whether user account is fully verified")
    user_id: str = Field(..., description="User unique identifier")
    has_profile: bool = Field(..., description="Whether user has already completed their role profile")

class CompleteProfileRequest(BaseModel):
    full_name: str = Field(..., description="User full display name")
    role: str = Field(..., description="Sports focus role: batsman, bowler, wicket_keeper, coach")
    avatar_url: Optional[str] = Field(None, description="Base64 encoded string profile avatar")
    
    # 🆕 Grassroots location and physical specifications
    height_cm: Optional[float] = Field(None, description="Player physical height in centimeters")
    weight_kg: Optional[float] = Field(None, description="Player weight in kilograms")
    age_years: Optional[int] = Field(18, description="Player age in years")
    dominant_hand: str = Field("right", description="Dominant hand style: 'right' or 'left'")
    country: Optional[str] = Field(None, description="Player home country name")
    state: Optional[str] = Field(None, description="Player state, province, or district")
    district: Optional[str] = Field(None, description="Player region or district")
    city_town: Optional[str] = Field(None, description="Player home city or village town")
    scout_opt_in: bool = Field(False, description="Whether player opts into the grassroots scouting stream")

class ProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str]
    role: str
    avatar_url: Optional[str] = None
    
    # 🆕 Grassroots location and physical specifications
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    age_years: Optional[int] = 18
    dominant_hand: str
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city_town: Optional[str] = None
    scout_opt_in: bool = False

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    phone_number: Optional[str]
    is_verified: bool
    profile: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True
