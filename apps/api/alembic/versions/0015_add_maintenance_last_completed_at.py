"""add maintenance_tasks.last_completed_at (missing from 0014)

Revision ID: 0015_add_maintenance_last_completed_at
Revises: 0014_add_trips_hours_maintenance_inventory
Create Date: 2026-02-16 00:00:00

"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0015_add_maintenance_last_completed_at"
down_revision: str | None = "0014_add_trips_hours_maintenance_inventory"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add last_completed_at if not present (for DBs that ran 0014 before it included this column)
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'maintenance_tasks' AND column_name = 'last_completed_at'
            """
        )
    )
    if result.fetchone() is None:
        op.add_column(
            "maintenance_tasks",
            sa.Column("last_completed_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("maintenance_tasks", "last_completed_at")
