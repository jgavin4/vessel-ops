from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Path
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import AuthContext
from app.deps import get_current_auth
from app.deps import get_db
from app.models import Vessel
from app.models import VesselComment
from app.schemas import VesselCommentCreate
from app.schemas import VesselCommentOut

router = APIRouter(tags=["comments"])


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


@router.get("/api/vessels/{vessel_id}/comments", response_model=list[VesselCommentOut])
def list_comments(
    vessel_id: int = Path(ge=1),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth),
) -> list[VesselComment]:
    """List all comments for a vessel."""
    verify_vessel_access(vessel_id, db, auth)
    comments = (
        db.execute(
            select(VesselComment)
            .where(VesselComment.vessel_id == vessel_id)
            .order_by(VesselComment.created_at.desc())
        )
        .scalars()
        .all()
    )
    return comments


@router.post("/api/vessels/{vessel_id}/comments", response_model=VesselCommentOut, status_code=201)
def create_comment(
    payload: VesselCommentCreate,
    vessel_id: int = Path(ge=1),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth),
) -> VesselComment:
    """Create a new comment for a vessel."""
    vessel = verify_vessel_access(vessel_id, db, auth)
    comment = VesselComment(
        vessel_id=vessel.id,
        user_id=auth.user_id,
        body=payload.body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
