from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.common import UTCDatetime


class ChapterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    start_ms: int
    position: int


class SummaryOut(BaseModel):
    """Summary + chapters for one meeting. `overview` is null if nothing was generated yet."""

    meeting_id: int
    overview: Optional[str] = None
    generated_by: Optional[str] = None
    generated_at: Optional[UTCDatetime] = None
    chapters: list[ChapterOut] = []
