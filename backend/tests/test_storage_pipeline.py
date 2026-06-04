"""Upload → disk write → worker read path resolution."""
import io
import os
import tempfile

import pytest

from app.core.storage_paths import resolve_storage_base_dir
from app.services.storage_service import StorageService


def test_resolve_storage_base_dir_uses_env(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp:
        monkeypatch.setenv("PITCHMIND_STORAGE_DIR", tmp)
        assert resolve_storage_base_dir() == os.path.abspath(tmp)


def test_save_video_writes_non_empty_file():
    with tempfile.TemporaryDirectory() as tmp:
        storage = StorageService(base_dir=tmp)
        payload = b"\x00\x00\x00\x18ftypmp41\x00" + b"\x00" * 12_000
        path = storage.save_video(
            "vid-test",
            "clip.mp4",
            io.BytesIO(payload),
        )
        assert os.path.isfile(path)
        assert os.path.getsize(path) == len(payload)
        resolved = storage.resolve_video_read_path("vid-test", path)
        assert resolved == os.path.abspath(path)
        assert os.path.getsize(resolved) > 0


def test_resolve_storage_subdir_under_base(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp:
        monkeypatch.setenv("PITCHMIND_STORAGE_DIR", tmp)
        from app.core.storage_paths import resolve_storage_subdir

        audio = resolve_storage_subdir("audio")
        assert audio == os.path.join(tmp, "audio")
        assert os.path.isdir(audio)


def test_save_video_rejects_tiny_payload():
    with tempfile.TemporaryDirectory() as tmp:
        storage = StorageService(base_dir=tmp)
        tiny = b"\x00" * 100
        with pytest.raises(OSError, match="too small"):
            storage.save_video("tiny-vid", "x.mp4", io.BytesIO(tiny))


def test_resolve_video_read_path_falls_back_to_canonical_dir():
    with tempfile.TemporaryDirectory() as tmp:
        storage = StorageService(base_dir=tmp)
        payload = b"\x00\x00\x00\x1cftypisom\x00\x00" + b"\x01" * 12_000
        path = storage.save_video("vid-b", "x.mp4", io.BytesIO(payload))
        wrong_stored = "/tmp/does-not-exist/original.mp4"
        resolved = storage.resolve_video_read_path("vid-b", wrong_stored)
        assert resolved == os.path.abspath(path)
