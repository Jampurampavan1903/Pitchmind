"""Upload validation limits aligned with storage_service."""
import pytest
from app.services.storage_service import StorageService


@pytest.fixture
def storage():
    return StorageService()


def test_rejects_oversized_file(storage):
    max_bytes = 50 * 1024 * 1024 + 1
    with pytest.raises(ValueError, match="50MB"):
        storage.validate_video("clip.mp4", max_bytes)


def test_rejects_unsupported_extension(storage):
    with pytest.raises(ValueError, match="Unsupported"):
        storage.validate_video("clip.webm", 1024)


def test_accepts_valid_mp4(storage):
    storage.validate_video("nets-session.mp4", 1024 * 1024)


def test_rejects_tiny_mp4(storage):
    with pytest.raises(ValueError, match="too small"):
        storage.validate_video("clip.mp4", 16)
