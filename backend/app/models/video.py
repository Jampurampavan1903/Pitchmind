from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Video(Base, TimestampMixin):
    """Maps to the 'videos' SQL database table, tracking player media uploads."""
    __tablename__ = "videos"
    
    id = Column(String, primary_key=True, index=True) # UUID string
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    
    # Telemetry extracted by OpenCV
    duration_seconds = Column(Float, nullable=True)
    fps = Column(Float, nullable=True)
    resolution = Column(String, nullable=True)
    
    status = Column(String, default="uploaded", nullable=False) # 'uploaded', 'processing', 'complete', 'failed'
    
    # Active relationships
    analysis = relationship("Analysis", back_populates="video", uselist=False, cascade="all, delete-orphan")
