from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, DateTime, func

Base = declarative_base()

class TimestampMixin:
    """Standard audit timestamps mixin to monitor when records are updated."""
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
