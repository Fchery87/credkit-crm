import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

# Association table for many-to-many relationship between clients and tags
client_tags = Table(
    'client_tags',
    Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column('client_id', UUID(as_uuid=True), ForeignKey('clients.id'), nullable=False),
    Column('tag_id', UUID(as_uuid=True), ForeignKey('tags.id'), nullable=False),
    Column('created_at', DateTime, server_default=func.now())
)