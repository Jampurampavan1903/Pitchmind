from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Float, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    """Maps to the 'users' SQL database table, representing batting/bowling players."""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True) # UUID String
    email = Column(String, nullable=True, unique=True, index=True)
    phone_number = Column(String, nullable=True, unique=True, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # OTP Authentication Fields
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    
    # Active relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Profile(Base, TimestampMixin):
    """Maps to the 'profiles' SQL database table, storing detailed athlete role metadata."""
    __tablename__ = "profiles"
    
    id = Column(String, primary_key=True, index=True) # UUID String
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    full_name = Column(String, nullable=True)
    role = Column(String, default="batsman", nullable=False) # 'batsman', 'bowler', 'wicket_keeper', 'coach'
    avatar_url = Column(Text, nullable=True)
    
    # Physical and Location Telemetry (Grassroots Update)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    age_years = Column(Integer, default=18, nullable=False)
    dominant_hand = Column(String, default="right", nullable=False) # 'right', 'left'
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    city_town = Column(String, nullable=True)
    scout_opt_in = Column(Boolean, default=False, nullable=False)
    
    # Active relationships
    user = relationship("User", back_populates="profile")
