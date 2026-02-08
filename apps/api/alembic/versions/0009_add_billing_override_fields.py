"""add billing override fields to organizations

Revision ID: 0009_add_billing_override_fields
Revises: 0008_add_inventory_groups
Create Date: 2026-02-08 00:00:00
"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009_add_billing_override_fields"
down_revision: str | None = "0008_add_inventory_groups"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Increase alembic_version.version_num column length to support longer revision IDs
    # The default is VARCHAR(32) but some revision IDs are longer (e.g., 0010_add_stripe_subscription_fields is 35 chars)
    # Use USING clause to ensure type conversion works correctly
    try:
        op.execute("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(255) USING version_num::VARCHAR(255)")
    except Exception:
        # If column is already VARCHAR(255) or doesn't exist, continue
        pass
    
    # Add billing override fields to organizations table
    op.add_column(
        "organizations",
        sa.Column("billing_override_enabled", sa.Boolean(), nullable=False, server_default="false")
    )
    op.add_column(
        "organizations",
        sa.Column("billing_override_vessel_limit", sa.Integer(), nullable=True)
    )
    op.add_column(
        "organizations",
        sa.Column("billing_override_expires_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "organizations",
        sa.Column("billing_override_reason", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("organizations", "billing_override_reason")
    op.drop_column("organizations", "billing_override_expires_at")
    op.drop_column("organizations", "billing_override_vessel_limit")
    op.drop_column("organizations", "billing_override_enabled")
