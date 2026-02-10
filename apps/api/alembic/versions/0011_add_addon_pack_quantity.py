"""add addon_pack_quantity to organizations

Revision ID: 0011_add_addon_pack_quantity
Revises: 0010_add_stripe_subscription_fields
Create Date: 2026-02-09

"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011_add_addon_pack_quantity"
down_revision: str | None = "0010_add_stripe_subscription_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("addon_pack_quantity", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("organizations", "addon_pack_quantity")
