"""Vessel total hours (sum of trip hours) helper."""

from decimal import Decimal

from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import VesselTrip


def get_vessel_total_hours(db: Session, vessel_id: int) -> Decimal:
    """Sum of all trip hours for the vessel."""
    row = db.execute(
        select(func.coalesce(func.sum(VesselTrip.hours), 0)).where(
            VesselTrip.vessel_id == vessel_id
        )
    ).fetchone()
    if row is None or row[0] is None:
        return Decimal("0")
    return Decimal(str(row[0]))
