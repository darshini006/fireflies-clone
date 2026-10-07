from typing import Optional

from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Chapter(Base):
    """A topic / outline entry that points at a moment in the meeting."""

    __tablename__ = "chapters"
    __table_args__ = (Index("ix_chapters_meeting_position", "meeting_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    start_ms: Mapped[int] = mapped_column(Integer)
    position: Mapped[int] = mapped_column(Integer)

    meeting: Mapped["Meeting"] = relationship(back_populates="chapters")
