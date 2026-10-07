from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import ActionItem, Meeting, User
from app.schemas.action_item import ActionItemCreate, ActionItemUpdate


def _check_assignee(meeting: Meeting, assignee_id: Optional[int]) -> None:
    if assignee_id is not None and assignee_id not in {p.id for p in meeting.participants}:
        raise HTTPException(
            422, "Assignee must be a participant of this meeting"
        )


def get_item_or_404(db: Session, item_id: int, user: User) -> ActionItem:
    item = db.scalar(
        select(ActionItem)
        .join(Meeting, ActionItem.meeting_id == Meeting.id)
        .where(ActionItem.id == item_id, Meeting.user_id == user.id)
        .options(joinedload(ActionItem.assignee), joinedload(ActionItem.meeting))
    )
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Action item not found")
    return item


def list_items(db: Session, meeting: Meeting) -> list[ActionItem]:
    return list(
        db.scalars(
            select(ActionItem)
            .where(ActionItem.meeting_id == meeting.id)
            .options(joinedload(ActionItem.assignee))
            .order_by(ActionItem.id)
        )
    )


def create_item(db: Session, meeting: Meeting, payload: ActionItemCreate) -> ActionItem:
    _check_assignee(meeting, payload.assignee_id)
    item = ActionItem(
        meeting_id=meeting.id,
        text=payload.text,
        assignee_id=payload.assignee_id,
        due_date=payload.due_date,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_item(db: Session, item: ActionItem, payload: ActionItemUpdate) -> ActionItem:
    changes = payload.model_dump(exclude_unset=True)

    # `text` and `is_completed` are NOT NULL columns, so an explicit null is a client error.
    for required in ("text", "is_completed"):
        if required in changes and changes[required] is None:
            raise HTTPException(422, f"{required} cannot be null")

    if "assignee_id" in changes:
        _check_assignee(item.meeting, changes["assignee_id"])

    for field, value in changes.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item: ActionItem) -> None:
    db.delete(item)
    db.commit()
