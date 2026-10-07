import math
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.utils import utcnow
from app.models import (
    ActionItem,
    Chapter,
    Meeting,
    Participant,
    Summary,
    TranscriptSegment,
    User,
)
from app.seed.seed_data import MEETINGS, PEOPLE
from app.services.transcript_parser import MIN_SEGMENT_MS, MS_PER_WORD


def _ms(timestamp: str) -> int:
    minutes, seconds = timestamp.split(":")
    return (int(minutes) * 60 + int(seconds)) * 1000


def _speech_ms(text: str) -> int:
    return max(MIN_SEGMENT_MS, len(text.split()) * MS_PER_WORD)


def seed_database(db: Session) -> None:
    settings = get_settings()

    user = db.scalar(select(User).where(User.email == settings.default_user_email))
    if user is None:
        user = User(name=settings.default_user_name, email=settings.default_user_email)
        db.add(user)

    people = {name: Participant(name=name, email=email) for name, email in PEOPLE}
    db.add_all(people.values())
    db.flush()

    now = utcnow()
    for spec in MEETINGS:
        hour, minute = spec["start"]
        meeting_date = (now - timedelta(days=spec["days_ago"])).replace(
            hour=hour, minute=minute, second=0, microsecond=0
        )

        meeting = Meeting(
            user_id=user.id,
            title=spec["title"],
            meeting_date=meeting_date,
            source="seed",
            participants=[people[name] for name in spec["participants"]],
        )

        starts = [_ms(ts) for _speaker, ts, _text in spec["transcript"]]
        last_end = 0
        for position, (speaker, _ts, text) in enumerate(spec["transcript"]):
            if speaker not in spec["participants"]:
                raise ValueError(f"Seed error: {speaker!r} is not a participant of {spec['title']!r}")
            start = starts[position]
            end = start + _speech_ms(text)
            if position + 1 < len(starts):
                end = min(end, starts[position + 1])
            last_end = end
            meeting.segments.append(
                TranscriptSegment(
                    position=position,
                    start_ms=start,
                    end_ms=end,
                    text=text,
                    speaker=people[speaker],
                )
            )
        # Round the duration up to a whole minute, like a recording would be.
        meeting.duration_seconds = math.ceil(last_end / 1000 / 60) * 60

        meeting.summary = Summary(overview=spec["overview"], generated_by="seed")
        for position, (ts, title, description) in enumerate(spec["chapters"]):
            meeting.chapters.append(
                Chapter(title=title, description=description, start_ms=_ms(ts), position=position)
            )
        for text, assignee, due_in_days, completed in spec["action_items"]:
            meeting.action_items.append(
                ActionItem(
                    text=text,
                    assignee=people[assignee],
                    due_date=(meeting_date + timedelta(days=due_in_days)).date(),
                    is_completed=completed,
                )
            )
        db.add(meeting)

    db.commit()


def seed_if_empty(db: Session) -> bool:
    """Seed only when there are no meetings yet. Returns True if data was inserted."""
    if db.scalar(select(func.count()).select_from(Meeting)):
        return False
    seed_database(db)
    return True
