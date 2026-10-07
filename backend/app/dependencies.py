from typing import Annotated

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models import User


def get_current_user(db: Session = Depends(get_db)) -> User:
    """No real auth in this project: everyone is the default logged-in user."""
    settings = get_settings()
    user = db.scalar(select(User).where(User.email == settings.default_user_email))
    if user is None:
        user = User(name=settings.default_user_name, email=settings.default_user_email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
