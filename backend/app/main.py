from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.db.session import SessionLocal, init_db
from app.routers import (
    action_items,
    health,
    meetings,
    participants,
    summary,
    transcript,
    users,
)
from app.seed.seeder import seed_if_empty

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Runs once on startup: create tables, then load demo data if the DB is empty.
    init_db()
    if settings.seed_on_startup:
        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (health, users, participants, meetings, transcript, summary, action_items):
    app.include_router(r.router, prefix="/api")

# Sample audio/video lives here and is served at /media/<file>.
settings.media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"name": settings.app_name, "docs": "/docs", "health": "/api/health"}
