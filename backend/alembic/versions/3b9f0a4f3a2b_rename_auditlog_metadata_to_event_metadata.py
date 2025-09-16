"""
Rename audit_logs.metadata to event_metadata

Revision ID: 3b9f0a4f3a2b
Revises: 
Create Date: 2025-09-15 00:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3b9f0a4f3a2b"
down_revision = None
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    try:
        cols = [c["name"] for c in insp.get_columns(table)]
        return column in cols
    except Exception:
        return False


def upgrade() -> None:
    # Only rename if the old column exists and the new one does not
    if _has_column("audit_logs", "metadata") and not _has_column("audit_logs", "event_metadata"):
        op.alter_column("audit_logs", "metadata", new_column_name="event_metadata")


def downgrade() -> None:
    # Reverse rename if event_metadata exists and metadata does not
    if _has_column("audit_logs", "event_metadata") and not _has_column("audit_logs", "metadata"):
        op.alter_column("audit_logs", "event_metadata", new_column_name="metadata")

