# Fireflies Clone: Backend (FastAPI + SQLAlchemy + SQLite)

## Run locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On first start the app creates `fireflies.db` and seeds 5 demo meetings.

- API docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

Reset the demo data any time: `python -m app.seed.run_seed --reset`

Run the tests: `pip install -r requirements-dev.txt && pytest`

## Configuration (optional, via env vars or `backend/.env`)

See `.env.example`: `DATABASE_URL`, `CORS_ORIGINS`, `SEED_ON_STARTUP`,
`DEFAULT_USER_NAME`, `DEFAULT_USER_EMAIL`.

## Layout

- `app/models`: ORM tables
- `app/schemas`: request/response validation (Pydantic)
- `app/routers`: thin HTTP layer
- `app/services`: business logic
- `app/seed`: demo data
- `media/`: static files served at `/media/...`
