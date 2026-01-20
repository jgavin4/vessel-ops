from datetime import datetime
from typing import Annotated
from typing import Optional

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field


class VesselBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    make: Optional[str] = Field(default=None, max_length=255)
    model: Optional[str] = Field(default=None, max_length=255)
    year: Optional[Annotated[int, Field(ge=1900, le=2100)]] = None
    description: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=255)


class VesselCreate(VesselBase):
    pass


class VesselUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    make: Optional[str] = Field(default=None, max_length=255)
    model: Optional[str] = Field(default=None, max_length=255)
    year: Optional[Annotated[int, Field(ge=1900, le=2100)]] = None
    description: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=255)


class VesselOut(VesselBase):
    id: int
    org_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
