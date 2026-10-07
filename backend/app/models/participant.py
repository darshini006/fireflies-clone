from typing import Optional

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Many-to-many link between meetings and participants.
meeting_participants = Table(
    "meeting_participants",
    Base.metadata,
    Column("meeting_id", ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "participant_id", ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True
    ),
)


class Participant(Base):
    """A person who attends meetings and/or speaks in transcripts."""

    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255))

    meetings: Mapped[list["Meeting"]] = relationship(
        secondary=meeting_participants, back_populates="participants"
    )
