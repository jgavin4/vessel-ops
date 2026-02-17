"""Trip hours endpoints and vessel total hours helper."""

import uuid
from datetime import datetime
from datetime import timezone
from decimal import Decimal

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Path
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import AuthContext
from app.deps import get_current_auth
from app.deps import get_db
from app.models import InventoryAdjustment
from app.models import Vessel
from app.models import VesselInventoryRequirement
from app.models import VesselTrip
from app.permissions import can_log_trips
from app.schemas import TripCreate
from app.schemas import TripOut
from app.schemas import TripUpdate
from app.services.vessel_hours import get_vessel_total_hours

router = APIRouter(tags=["trips"])


def verify_vessel_access(
    vessel_id: int, db: Session, auth: AuthContext
) -> Vessel:
    """Verify vessel exists and user has access via org."""
    vessel = (
        db.execute(
            select(Vessel).where(Vessel.id == vessel_id, Vessel.org_id == auth.org_id)
        )
        .scalars()
        .one_or_none()
    )
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return vessel


class TotalHoursOut(BaseModel):
    total_hours: float


@router.get("/api/vessels/{vessel_id}/total-hours", response_model=TotalHoursOut)
def get_vessel_total_hours_endpoint(
    vessel_id: int = Path(ge=1),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth),
) -> TotalHoursOut:
    """Return computed total trip hours for the vessel."""
    verify_vessel_access(vessel_id, db, auth)
    total = get_vessel_total_hours(db, vessel_id)
    return TotalHoursOut(total_hours=float(total))


@router.get("/api/vessels/{vessel_id}/trips", response_model=list[TripOut])
def list_trips(
    vessel_id: int = Path(ge=1),
    limit: int = 50,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth),
) -> list[VesselTrip]:
    """List recent trips for a vessel (newest first)."""
    verify_vessel_access(vessel_id, db, auth)
    trips = (
        db.execute(
            select(VesselTrip)
            .where(VesselTrip.vessel_id == vessel_id)
            .order_by(VesselTrip.logged_at.desc())
            .limit(min(limit, 200))
        )
        .scalars()
        .all()
    )
    return list(trips)


@router.post("/api/vessels/{vessel_id}/trips", response_model=TripOut, status_code=201)
def create_trip(
    payload: TripCreate,
    vessel_id: int = Path(ge=1),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth),
) -> VesselTrip:
    """Create a trip. Defaults logged_at to now if missing. Applies optional inventory auto-consumption in same transaction."""
    if not can_log_trips(auth):
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to log trips",
        )
    vessel = verify_vessel_access(vessel_id, db, auth)
    logged_at = payload.logged_at or datetime.now(timezone.utc)
    hours = Decimal(str(payload.hours))
    if hours <= 0:
        raise HTTPException(status_code=400, detail="hours must be greater than 0")

    trip = VesselTrip(
        vessel_id=vessel.id,
        logged_at=logged_at,
        hours=hours,
        note=payload.note,
        created_by_user_id=auth.user_id,
    )
    db.add(trip)
    db.flush()  # get trip.id for adjustments

    # Auto-consumption: requirements with auto_consume_enabled and consume_per_hour
    requirements = (
        db.execute(
            select(VesselInventoryRequirement).where(
                VesselInventoryRequirement.vessel_id == vessel.id,
                VesselInventoryRequirement.auto_consume_enabled.is_(True),
                VesselInventoryRequirement.consume_per_hour.isnot(None),
                VesselInventoryRequirement.consume_per_hour > 0,
            )
        )
        .scalars()
        .all()
    )
    for req in requirements:
        consume_per_hour = req.consume_per_hour or Decimal("0")
        raw_consumption = float(hours * consume_per_hour)
        delta_wanted = -int(round(raw_consumption))
        if delta_wanted >= 0:
            continue
        before_qty = req.current_quantity or 0
        after_qty = max(0, before_qty + delta_wanted)
        actual_delta = after_qty - before_qty
        req.current_quantity = after_qty
        adj = InventoryAdjustment(
            requirement_id=req.id,
            reason="trip",
            reference_trip_id=trip.id,
            delta=actual_delta,
            before_qty=before_qty,
            after_qty=after_qty,
            created_by_user_id=auth.user_id,
        )
        db.add(adj)

    db.commit()
    db.refresh(trip)
    return trip


@router.patch(
    "/api/vessels/{vessel_id}/trips/{trip_id}",
    response_model=TripOut,
)
def update_trip(
    payload: TripUpdate,
    vessel_id: int = Path(ge=1),
    trip_id: str = Path(),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth),
) -> VesselTrip:
    """Update trip hours, logged_at, or note."""
    if not can_log_trips(auth):
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to edit trips",
        )
    verify_vessel_access(vessel_id, db, auth)
    trip = (
        db.execute(
            select(VesselTrip).where(
                VesselTrip.id == trip_id,
                VesselTrip.vessel_id == vessel_id,
            )
        )
        .scalars()
        .one_or_none()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    updates = payload.model_dump(exclude_unset=True)
    if "hours" in updates:
        h = updates["hours"]
        if h is not None and h <= 0:
            raise HTTPException(status_code=400, detail="hours must be greater than 0")
        updates["hours"] = Decimal(str(h)) if h is not None else None
    for field, value in updates.items():
        if value is not None:
            setattr(trip, field, value)

    db.commit()
    db.refresh(trip)
    return trip


@router.delete(
    "/api/vessels/{vessel_id}/trips/{trip_id}",
    status_code=204,
)
def delete_trip(
    vessel_id: int = Path(ge=1),
    trip_id: str = Path(),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth),
) -> None:
    """Delete a trip."""
    if not can_log_trips(auth):
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to delete trips",
        )
    verify_vessel_access(vessel_id, db, auth)
    tid = _parse_trip_id(trip_id)
    trip = (
        db.execute(
            select(VesselTrip).where(
                VesselTrip.id == tid,
                VesselTrip.vessel_id == vessel_id,
            )
        )
        .scalars()
        .one_or_none()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
