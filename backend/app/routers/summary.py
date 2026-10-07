from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession
from app.schemas.summary import SummaryOut
from app.services import meeting_service

router = APIRouter(prefix="/meetings/{meeting_id}/summary", tags=["summary"])


@router.get("", response_model=SummaryOut)
def get_summary(meeting_id: int, db: DbSession, user: CurrentUser):
    meeting = meeting_service.get_meeting_or_404(db, meeting_id, user)
    summary = meeting.summary
    return {
        "meeting_id": meeting.id,
        "overview": summary.overview if summary else None,
        "generated_by": summary.generated_by if summary else None,
        "generated_at": summary.generated_at if summary else None,
        "chapters": meeting.chapters,
    }
