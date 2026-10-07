from fastapi import APIRouter
from sqlalchemy import select

from app.dependencies import CurrentUser, DbSession
from app.models import Meeting, Participant, meeting_participants
from app.schemas.participant import ParticipantOut

router = APIRouter(tags=["participants"])


@router.get("/participants", response_model=list[ParticipantOut])
def list_participants(db: DbSession, user: CurrentUser):
    """Everyone who appears in at least one of the user's meetings (feeds the filter dropdown)."""
    stmt = (
        select(Participant)
        .join(meeting_participants, meeting_participants.c.participant_id == Participant.id)
        .join(Meeting, Meeting.id == meeting_participants.c.meeting_id)
        .where(Meeting.user_id == user.id)
        .distinct()
        .order_by(Participant.name)
    )
    return list(db.scalars(stmt))
