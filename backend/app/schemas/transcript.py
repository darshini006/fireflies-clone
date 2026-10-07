from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.participant import ParticipantOut


class SegmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: int
    start_ms: int
    end_ms: int
    text: str
    speaker: Optional[ParticipantOut] = None


class TranscriptOut(BaseModel):
    meeting_id: int
    segments: list[SegmentOut]
