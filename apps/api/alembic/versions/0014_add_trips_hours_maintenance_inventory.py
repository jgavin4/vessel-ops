"""add trips, hour-based maintenance, inventory adjustments and auto-consume

Revision ID: 0014_add_trips_hours_maintenance_inventory
Revises: 0013_add_maintenance_sort_order
Create Date: 2026-02-16 00:00:00

"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0014_add_trips_hours_maintenance_inventory"
down_revision: str | None = "0013_add_maintenance_sort_order"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # vessel_trips
    op.create_table(
        "vessel_trips",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("vessel_id", sa.Integer(), nullable=False),
        sa.Column(
            "logged_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("hours", sa.Numeric(12, 4), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["vessel_id"], ["vessels.id"]),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.Index("ix_vessel_trips_vessel_id", "vessel_id"),
    )

    # inventory_adjustments
    op.create_table(
        "inventory_adjustments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("requirement_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(50), nullable=False),
        sa.Column("reference_trip_id", sa.Uuid(), nullable=True),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("before_qty", sa.Integer(), nullable=False),
        sa.Column("after_qty", sa.Integer(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["requirement_id"], ["vessel_inventory_requirements.id"]),
        sa.ForeignKeyConstraint(["reference_trip_id"], ["vessel_trips.id"]),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.Index("ix_inventory_adjustments_requirement_id", "requirement_id"),
        sa.Index("ix_inventory_adjustments_reference_trip_id", "reference_trip_id"),
    )

    # maintenance_tasks: interval_hours, last_completed_at, last_completed_total_hours
    op.add_column(
        "maintenance_tasks",
        sa.Column("interval_hours", sa.Numeric(14, 4), nullable=True),
    )
    op.add_column(
        "maintenance_tasks",
        sa.Column("last_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "maintenance_tasks",
        sa.Column("last_completed_total_hours", sa.Numeric(14, 4), nullable=True),
    )

    # vessel_inventory_requirements: current_quantity, auto_consume_enabled, consume_per_hour
    op.add_column(
        "vessel_inventory_requirements",
        sa.Column("current_quantity", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "vessel_inventory_requirements",
        sa.Column("auto_consume_enabled", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "vessel_inventory_requirements",
        sa.Column("consume_per_hour", sa.Numeric(12, 4), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("vessel_inventory_requirements", "consume_per_hour")
    op.drop_column("vessel_inventory_requirements", "auto_consume_enabled")
    op.drop_column("vessel_inventory_requirements", "current_quantity")
    op.drop_column("maintenance_tasks", "last_completed_total_hours")
    op.drop_column("maintenance_tasks", "last_completed_at")
    op.drop_column("maintenance_tasks", "interval_hours")
    op.drop_table("inventory_adjustments")
    op.drop_table("vessel_trips")
