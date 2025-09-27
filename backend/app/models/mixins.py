from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func


class TimestampMixin:
    """Adds created_at/updated_at timestamps."""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class SoftDeleteMixin:
    """Optional soft-delete via nullable deleted_at."""
    deleted_at = Column(DateTime(timezone=True), nullable=True)
