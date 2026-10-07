from fastapi import APIRouter, Response, status

from app.dependencies import CurrentUser, DbSession
from app.schemas.action_item import ActionItemCreate, ActionItemOut, ActionItemUpdate
from app.services import action_item_service, meeting_service

router = APIRouter(tags=["action items"])


@router.get("/meetings/{meeting_id}/action-items", response_model=list[ActionItemOut])
def list_action_items(meeting_id: int, db: DbSession, user: CurrentUser):
    meeting = meeting_service.get_meeting_or_404(db, meeting_id, user)
    return action_item_service.list_items(db, meeting)


@router.post(
    "/meetings/{meeting_id}/action-items",
    response_model=ActionItemOut,
    status_code=status.HTTP_201_CREATED,
)
def create_action_item(
    meeting_id: int, payload: ActionItemCreate, db: DbSession, user: CurrentUser
):
    meeting = meeting_service.get_meeting_or_404(db, meeting_id, user)
    return action_item_service.create_item(db, meeting, payload)


@router.patch("/action-items/{item_id}", response_model=ActionItemOut)
def update_action_item(item_id: int, payload: ActionItemUpdate, db: DbSession, user: CurrentUser):
    """Edit text/assignee/due date, or mark done with {"is_completed": true}."""
    item = action_item_service.get_item_or_404(db, item_id, user)
    return action_item_service.update_item(db, item, payload)


@router.delete("/action-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_item(item_id: int, db: DbSession, user: CurrentUser):
    item = action_item_service.get_item_or_404(db, item_id, user)
    action_item_service.delete_item(db, item)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
