from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.schemas.common import UTCDatetime
from app.schemas.participant import ParticipantOut

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]


def _clean_names(names: list[str]) -> list[str]:
    """Trim, drop blanks, and de-duplicate (case-insensitively) while keeping order."""
    seen: set[str] = set()
    cleaned: list[str] = []
    for name in names:
        name = name.strip()
        if name and name.lower() not in seen:
            seen.add(name.lower())
            cleaned.append(name)
    return cleaned


class MeetingCreate(BaseModel):
    title: Title
    meeting_date: Optional[datetime] = None  # defaults to "now"
    duration_seconds: int = Field(default=0, ge=0)
    participants: list[str] = Field(default_factory=list)
    # Optional pasted transcript, one turn per line: "[MM:SS] Speaker: text"
    transcript_text: Optional[str] = None

    @field_validator("participants")
    @classmethod
    def _participants(cls, v: list[str]) -> list[str]:
        return _clean_names(v)


class MeetingUpdate(BaseModel):
    title: Optional[Title] = None
    participants: Optional[list[str]] = None

    @field_validator("participants")
    @classmethod
    def _participants(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        return None if v is None else _clean_names(v)


class MeetingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    meeting_date: UTCDatetime
    duration_seconds: int
    media_url: Optional[str] = None
    source: str
    created_at: UTCDatetime
    updated_at: UTCDatetime
    participants: list[ParticipantOut] = []


class MeetingListResponse(BaseModel):
    items: list[MeetingOut]
    total: int
    page: int
    limit: int
