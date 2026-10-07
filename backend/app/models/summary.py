from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.utils import utcnow
from app.db.base import Base


class Summary(Base):
    """AI summary of a meeting. Exactly one per meeting (UNIQUE meeting_id)."""

    __tablename__ = "summaries"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), unique=True
    )
    overview: Mapped[str] = mapped_column(Text)
    # 'seed' | 'mock' | 'llm'
    generated_by: Mapped[str] = mapped_column(String(20), default="seed")
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    meeting: Mapped["Meeting"] = relationship(back_populates="summary")
