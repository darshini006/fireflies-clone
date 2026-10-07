from fastapi import APIRouter
from sqlalchemy import text

from app.dependencies import DbSession

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: DbSession) -> dict:
    db.execute(text("SELECT 1"))  # proves the database is reachable
    return {"status": "ok", "database": "ok"}
