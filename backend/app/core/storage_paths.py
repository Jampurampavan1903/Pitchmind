"""Canonical storage root — stable on Render (cd backend) and local dev."""
from __future__ import annotations

import os
from pathlib import Path


def resolve_storage_subdir(name: str) -> str:
    """Canonical subdirectory under storage root (e.g. audio, videos)."""
    path = os.path.join(resolve_storage_base_dir(), name)
    os.makedirs(path, exist_ok=True)
    return path


def resolve_storage_base_dir() -> str:
    """
    Prefer PITCHMIND_STORAGE_DIR; else repo-root storage/ adjacent to backend/.
    Does not depend on process cwd (fixes ../storage drift).
    """
    env_dir = os.getenv("PITCHMIND_STORAGE_DIR", "").strip()
    if env_dir:
        return os.path.abspath(env_dir)
    backend_dir = Path(__file__).resolve().parents[2]
    return str((backend_dir.parent / "storage").resolve())
