"""allow null case_id on suggestion_runs

Revision ID: 89ab809b9669
Revises: 83c4f7b4b621
Create Date: 2025-09-18 01:18:33.161953+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "89ab809b9669"
down_revision: Union[str, None] = "83c4f7b4b621"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "suggestion_runs",
        "case_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "suggestion_runs",
        "case_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
