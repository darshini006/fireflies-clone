from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.dependencies import CurrentUser, DbSession
from app.models import TranscriptSegment
from app.schemas.transcript import TranscriptOut
from app.services import meeting_service

router = APIRouter(prefix="/meetings/{meeting_id}/transcript", tags=["transcript"])


@router.get("", response_model=TranscriptOut)
def get_transcript(meeting_id: int, db: DbSession, user: CurrentUser):
    meeting = meeting_service.get_meeting_or_404(db, meeting_id, user)
    segments = db.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id == meeting.id)
        .options(joinedload(TranscriptSegment.speaker))
        .order_by(TranscriptSegment.position)
    ).all()
    return {"meeting_id": meeting.id, "segments": segments}
