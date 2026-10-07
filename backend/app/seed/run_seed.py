"""Seed the database from the command line.

    python -m app.seed.run_seed            # seed only if the database has no meetings
    python -m app.seed.run_seed --reset    # wipe every table and re-seed from scratch
"""
import argparse

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import SessionLocal, engine, init_db
from app.seed.seeder import seed_database, seed_if_empty


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the demo database")
    parser.add_argument("--reset", action="store_true", help="drop all tables and re-seed")
    args = parser.parse_args()

    if args.reset:
        Base.metadata.drop_all(bind=engine)
    init_db()

    with SessionLocal() as db:
        if args.reset:
            seed_database(db)
            print("Database reset and seeded.")
        elif seed_if_empty(db):
            print("Database seeded.")
        else:
            print("Database already has meetings; nothing to do (use --reset to start over).")


if __name__ == "__main__":
    main()
