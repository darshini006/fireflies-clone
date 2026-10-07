from datetime import date
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.schemas.common import UTCDatetime
from app.schemas.participant import ParticipantOut

ItemText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class ActionItemCreate(BaseModel):
    text: ItemText
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None


class ActionItemUpdate(BaseModel):
    """All fields optional. Only the fields actually sent are changed (PATCH semantics),
    so `"assignee_id": null` clears the assignee while omitting it leaves it alone."""

    text: Optional[ItemText] = None
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None
    is_completed: Optional[bool] = None


class ActionItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    text: str
    due_date: Optional[date] = None
    is_completed: bool
    created_at: UTCDatetime
    assignee_id: Optional[int] = None
    assignee: Optional[ParticipantOut] = None
