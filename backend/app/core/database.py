from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


def _engine_kwargs(url: str) -> dict:
    if url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {}


def _ensure_sqlite_dir(url: str) -> None:
    if not url.startswith("sqlite:///./"):
        return
    relative = url.removeprefix("sqlite:///./")
    path = Path(relative)
    if path.parent.parts:
        path.parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_dir(settings.database_url)
engine = create_engine(settings.database_url, **_engine_kwargs(settings.database_url))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
