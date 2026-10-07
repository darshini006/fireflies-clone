from typing import Optional

from sqlalchemy import ForeignKey, Index, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TranscriptSegment(Base):
    """One speaker turn in a transcript. Times are milliseconds from the start of the meeting."""

    __tablename__ = "transcript_segments"
    __table_args__ = (Index("ix_segments_meeting_position", "meeting_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"))
    speaker_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("participants.id", ondelete="SET NULL")
    )
    position: Mapped[int] = mapped_column(Integer)
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)

    meeting: Mapped["Meeting"] = relationship(back_populates="segments")
    speaker: Mapped[Optional["Participant"]] = relationship()
