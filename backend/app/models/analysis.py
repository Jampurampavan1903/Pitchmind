from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Analysis(Base, TimestampMixin):
    """Maps to the 'analyses' SQL database table, holding detailed pose tracking and evaluations."""
    __tablename__ = "analyses"
    
    id = Column(String, primary_key=True, index=True) # UUID string
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending", nullable=False) # 'pending', 'processing', 'complete', 'failed'
    
    # SQLite JSON support columns
    landmarks_json = Column(Text, nullable=True) # 33 joint coordinate arrays
    metrics_json = Column(Text, nullable=True)   # Joint angle and balance score outputs
    coaching_json = Column(Text, nullable=True)  # Natural language drills recommendations
    deliveries_json = Column(Text, nullable=True) # 🆕 Multi-delivery results list
    
    frame_count = Column(Integer, default=0, nullable=False)
    processing_time_seconds = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Back relationships
    video = relationship("Video", back_populates="analysis")
