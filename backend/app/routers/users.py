from fastapi import APIRouter

from app.dependencies import CurrentUser
from app.schemas.participant import UserOut

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
def read_me(user: CurrentUser):
    return user
