from dataclasses import dataclass
from typing import Generator

from sqlalchemy.orm import Session

from app.db import SessionLocal


@dataclass
class AuthContext:
    user_id: int
    org_id: int


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_auth() -> AuthContext:
    return AuthContext(user_id=1, org_id=1)
