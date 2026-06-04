"""Lightweight SQLite migrations for coach-safety columns (no Alembic)."""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection


def ensure_videos_user_id_column(connection: Connection) -> None:
    inspector = inspect(connection)
    if "videos" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("videos")}
    if "user_id" not in columns:
        connection.execute(
            text("ALTER TABLE videos ADD COLUMN user_id VARCHAR")
        )
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_videos_user_id ON videos (user_id)")
        )
