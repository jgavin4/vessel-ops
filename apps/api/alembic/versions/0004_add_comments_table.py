"""add comments table

Revision ID: 0004_add_comments_table
Revises: 0003_add_maintenance_tables
Create Date: 2026-01-20 00:00:00
"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_add_comments_table"
down_revision: str | None = "0003_add_maintenance_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vessel_comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("vessel_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["vessel_id"], ["vessels.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.Index("ix_vessel_comments_vessel_id", "vessel_id"),
    )


def downgrade() -> None:
    op.drop_table("vessel_comments")
