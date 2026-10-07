from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Query, Response, status

from app.dependencies import CurrentUser, DbSession
from app.schemas.meeting import MeetingCreate, MeetingListResponse, MeetingOut, MeetingUpdate
from app.services import meeting_service

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=MeetingListResponse)
def list_meetings(
    db: DbSession,
    user: CurrentUser,
    q: Optional[str] = Query(None, description="Matches meeting title or participant name"),
    participant_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sort: Literal["newest", "oldest"] = "newest",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    items, total = meeting_service.list_meetings(
        db,
        user,
        q=q,
        participant_id=participant_id,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        page=page,
        limit=limit,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.post("", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: MeetingCreate, db: DbSession, user: CurrentUser):
    return meeting_service.create_meeting(db, user, payload)


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: int, db: DbSession, user: CurrentUser):
    return meeting_service.get_meeting_or_404(db, meeting_id, user)


@router.patch("/{meeting_id}", response_model=MeetingOut)
def update_meeting(meeting_id: int, payload: MeetingUpdate, db: DbSession, user: CurrentUser):
    meeting = meeting_service.get_meeting_or_404(db, meeting_id, user)
    return meeting_service.update_meeting(db, meeting, payload)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: int, db: DbSession, user: CurrentUser):
    meeting = meeting_service.get_meeting_or_404(db, meeting_id, user)
    meeting_service.delete_meeting(db, meeting)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
