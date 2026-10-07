import math
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.utils import to_naive_utc, utcnow
from app.models import ActionItem, Meeting, Participant, TranscriptSegment, User
from app.schemas.meeting import MeetingCreate, MeetingUpdate
from app.services.transcript_parser import TranscriptParseError, parse_transcript_text


def get_meeting_or_404(db: Session, meeting_id: int, user: User) -> Meeting:
    meeting = db.scalar(
        select(Meeting)
        .where(Meeting.id == meeting_id, Meeting.user_id == user.id)
        .options(selectinload(Meeting.participants))
    )
    if meeting is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meeting not found")
    return meeting


def get_or_create_participants(db: Session, names: list[str]) -> list[Participant]:
    """Participants are matched by name (case-insensitive); unknown names are created."""
    result: list[Participant] = []
    for name in names:
        participant = db.scalars(
            select(Participant).where(func.lower(Participant.name) == name.lower())
        ).first()
        if participant is None:
            participant = Participant(name=name)
            db.add(participant)
            db.flush()
        result.append(participant)
    return result


def list_meetings(
    db: Session,
    user: User,
    *,
    q: Optional[str],
    participant_id: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    sort: str,
    page: int,
    limit: int,
) -> tuple[list[Meeting], int]:
    stmt = select(Meeting).where(Meeting.user_id == user.id)

    if q and q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Meeting.title.ilike(like), Meeting.participants.any(Participant.name.ilike(like)))
        )
    if participant_id is not None:
        stmt = stmt.where(Meeting.participants.any(Participant.id == participant_id))
    if date_from is not None:
        stmt = stmt.where(Meeting.meeting_date >= datetime.combine(date_from, time.min))
    if date_to is not None:
        # inclusive of the whole "to" day
        stmt = stmt.where(
            Meeting.meeting_date < datetime.combine(date_to + timedelta(days=1), time.min)
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    order = Meeting.meeting_date.asc() if sort == "oldest" else Meeting.meeting_date.desc()
    stmt = (
        stmt.options(selectinload(Meeting.participants))
        .order_by(order, Meeting.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return list(db.scalars(stmt).all()), total


def create_meeting(db: Session, user: User, payload: MeetingCreate) -> Meeting:
    meeting = Meeting(
        user_id=user.id,
        title=payload.title,
        meeting_date=to_naive_utc(payload.meeting_date) if payload.meeting_date else utcnow(),
        duration_seconds=payload.duration_seconds,
        source="paste" if payload.transcript_text else "form",
    )
    meeting.participants = get_or_create_participants(db, payload.participants)

    if payload.transcript_text and payload.transcript_text.strip():
        try:
            parsed = parse_transcript_text(payload.transcript_text)
        except TranscriptParseError as exc:
            raise HTTPException(422, str(exc))

        # Everyone who speaks is also a participant of the meeting.
        speakers = {
            p.name.lower(): p
            for p in get_or_create_participants(db, list(dict.fromkeys(s.speaker for s in parsed)))
        }
        known = {p.id for p in meeting.participants}
        for speaker in speakers.values():
            if speaker.id not in known:
                meeting.participants.append(speaker)

        for position, seg in enumerate(parsed):
            meeting.segments.append(
                TranscriptSegment(
                    position=position,
                    start_ms=seg.start_ms,
                    end_ms=seg.end_ms,
                    text=seg.text,
                    speaker=speakers[seg.speaker.lower()],
                )
            )
        transcript_seconds = math.ceil(parsed[-1].end_ms / 1000)
        meeting.duration_seconds = max(meeting.duration_seconds, transcript_seconds)

    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def update_meeting(db: Session, meeting: Meeting, payload: MeetingUpdate) -> Meeting:
    if payload.title is not None:
        meeting.title = payload.title

    if payload.participants is not None:
        new_participants = get_or_create_participants(db, payload.participants)
        removed_ids = {p.id for p in meeting.participants} - {p.id for p in new_participants}
        meeting.participants = new_participants
        # An action item can't stay assigned to someone who's no longer in the meeting.
        if removed_ids:
            for item in db.scalars(
                select(ActionItem).where(
                    ActionItem.meeting_id == meeting.id, ActionItem.assignee_id.in_(removed_ids)
                )
            ):
                item.assignee_id = None

    db.commit()
    db.refresh(meeting)
    return meeting


def delete_meeting(db: Session, meeting: Meeting) -> None:
    db.delete(meeting)  # ORM cascade removes segments, summary, chapters, action items
    db.commit()
