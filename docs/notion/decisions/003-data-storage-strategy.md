# ADR-003 — Data Storage Strategy

| Field    | Value                                              |
| -------- | -------------------------------------------------- |
| Date     | 2025-05-27                                         |
| Author   | PitchMind Engineering                              |
| Status   | **Accepted**                                       |
| Category | Architecture Decision Record                      |

---

## Summary

PitchMind V1 uses a dual-storage strategy: **SQLite** for structured metadata and **local filesystem** for binary assets (videos, frames, exports). Both are wrapped in abstraction layers to enable migration to PostgreSQL and S3 without code changes. Evolving data (metrics, landmarks, coaching) is stored as JSON columns to avoid premature schema normalization.

---

## Problem Statement

PitchMind stores three categories of data:

1. **Binary assets** — uploaded videos (10-100MB), extracted frames (100KB each, hundreds per video), generated reports
2. **Structured metadata** — video info (filename, duration, resolution), analysis status, processing timestamps
3. **Analysis results** — 33-landmark pose data per frame, biomechanical metrics, coaching insights

Each category has different access patterns, size characteristics, and schema stability. The storage strategy must handle all three while remaining zero-ops for V1.

---

## Decision

### File Storage Layout

All binary assets are stored under a `storage/` directory at the project root, organized by purpose and video ID:

```
storage/
├── videos/
│   └── {video_id}/
│       └── original.mp4              # Raw uploaded video (preserved as-is)
│
├── frames/
│   └── {video_id}/
│       ├── frame_0001.jpg            # Extracted key frames
│       ├── frame_0002.jpg
│       ├── frame_0003.jpg
│       └── ...                       # Up to max_frames (default 300)
│
└── exports/
    └── {video_id}/
        ├── report.pdf                # Generated analysis report (future)
        └── overlay.mp4               # Pose overlay video (future)
```

| Directory          | Content                 | Size per Video | Access Pattern             | Retention        |
| ------------------ | ----------------------- | -------------- | -------------------------- | ---------------- |
| `storage/videos/`  | Raw uploaded videos     | 10–100 MB      | Write once, read rarely    | Permanent        |
| `storage/frames/`  | Extracted key frames    | 5–30 MB total  | Write once, read for UI    | Permanent        |
| `storage/exports/` | Generated reports       | 1–5 MB         | Write once, read on demand | Permanent        |

> [!NOTE]
> The `{video_id}` is a UUID generated at upload time. This ensures no filename collisions and enables O(1) lookup. The original filename is preserved in the database `videos.filename` column, not in the filesystem.

### Database Schema (SQLite)

```sql
-- videos table: tracks uploaded videos and their processing status
CREATE TABLE videos (
    id              TEXT PRIMARY KEY,          -- UUID v4
    filename        TEXT NOT NULL,             -- Original upload filename
    file_path       TEXT NOT NULL,             -- Relative path: storage/videos/{id}/original.mp4
    file_size_bytes INTEGER NOT NULL,          -- Raw file size for upload validation
    duration        REAL,                      -- Video duration in seconds (extracted)
    fps             REAL,                      -- Frames per second (extracted)
    resolution      TEXT,                      -- "{width}x{height}" string
    status          TEXT NOT NULL DEFAULT 'uploaded',  -- uploaded | processing | completed | failed
    created_at      TEXT NOT NULL,             -- ISO 8601 timestamp
    updated_at      TEXT NOT NULL              -- ISO 8601 timestamp
);

-- analyses table: stores pipeline results for each video
CREATE TABLE analyses (
    id                  TEXT PRIMARY KEY,      -- UUID v4
    video_id            TEXT NOT NULL,         -- FK → videos.id
    status              TEXT NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
    landmarks_json      TEXT,                  -- Full MediaPipe landmarks (JSON blob)
    metrics_json        TEXT,                  -- Biomechanical metrics (JSON blob)
    coaching_json       TEXT,                  -- Coaching insights (JSON blob)
    overall_score       REAL,                  -- 0-100 composite score
    frame_count         INTEGER,               -- Number of frames processed
    processing_time     REAL,                  -- Pipeline execution time (seconds)
    error_message       TEXT,                  -- Error details if status = 'failed'
    created_at          TEXT NOT NULL,          -- ISO 8601 timestamp
    updated_at          TEXT NOT NULL,          -- ISO 8601 timestamp
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created ON videos(created_at);
CREATE INDEX idx_analyses_video_id ON analyses(video_id);
CREATE INDEX idx_analyses_status ON analyses(status);
```

### SQLAlchemy Models

```python
# backend/src/pitchmind/models/video.py

class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    duration = Column(Float, nullable=True)
    fps = Column(Float, nullable=True)
    resolution = Column(String, nullable=True)
    status = Column(String, nullable=False, default="uploaded")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    analyses = relationship("Analysis", back_populates="video", cascade="all, delete-orphan")
```

```python
# backend/src/pitchmind/models/analysis.py

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default="pending")
    landmarks_json = Column(Text, nullable=True)         # JSON blob
    metrics_json = Column(Text, nullable=True)            # JSON blob
    coaching_json = Column(Text, nullable=True)           # JSON blob
    overall_score = Column(Float, nullable=True)
    frame_count = Column(Integer, nullable=True)
    processing_time = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    video = relationship("Video", back_populates="analyses")
```

---

## Technical Decisions

### 1. Metrics as JSON Columns (Not Normalized Tables)

**Decision:** Store `landmarks_json`, `metrics_json`, and `coaching_json` as JSON text columns instead of normalized relational tables.

| Approach                   | Pros                                        | Cons                                          |
| -------------------------- | ------------------------------------------- | --------------------------------------------- |
| **JSON columns (chosen)**  | Schema flexibility, rapid iteration, simple queries | No SQL-level filtering on nested fields, larger row size |
| Normalized tables          | SQL queries on individual metrics, referential integrity | Schema migration on every metric change, complex JOINs |
| Separate document store    | Best of both worlds                         | Second database to operate (MongoDB, etc.)    |

**Rationale:** The metrics schema is evolving rapidly in V1. Every time we add a new biomechanical measurement (e.g., "bat speed estimation"), a normalized schema would require:
1. New migration file
2. New SQLAlchemy model
3. New Pydantic schema
4. Updated queries

With JSON columns, we just update the Python dataclass and the JSON blob changes shape automatically.

> [!WARNING]
> JSON columns prevent SQL-level aggregation queries like "average elbow angle across all videos." This is acceptable for V1 (single-user, <100 analyses). For V2+ analytics features, migrate metrics to normalized columns while keeping landmarks as JSON.

### 2. Landmarks as JSON Blob

**Decision:** Store the full MediaPipe landmark data as a JSON blob in `landmarks_json`.

Landmark data structure per frame:
```json
{
  "frame_index": 42,
  "timestamp_ms": 1400.0,
  "landmarks": [
    {"id": 0, "name": "nose", "x": 0.52, "y": 0.31, "z": -0.08, "visibility": 0.99},
    {"id": 11, "name": "left_shoulder", "x": 0.58, "y": 0.45, "z": -0.12, "visibility": 0.95},
    // ... 33 landmarks per frame
  ]
}
```

For a 300-frame video: **~33 landmarks × 300 frames × ~100 bytes = ~1MB JSON**

This is always queried by `analysis_id` (single-row lookup), never aggregated across videos. JSON is the correct storage format.

### 3. Local Filesystem with StorageService Abstraction

**Decision:** Store files on the local filesystem, accessed through a `StorageService` interface.

```python
# backend/src/pitchmind/services/storage.py

class StorageService(ABC):
    """Abstract interface — swap implementations without changing callers."""

    @abstractmethod
    async def save_video(self, video_id: str, file: UploadFile) -> str: ...

    @abstractmethod
    async def get_video_path(self, video_id: str) -> str: ...

    @abstractmethod
    async def save_frame(self, video_id: str, frame_index: int, frame_data: bytes) -> str: ...

    @abstractmethod
    async def list_frames(self, video_id: str) -> list[str]: ...

    @abstractmethod
    async def delete_video_assets(self, video_id: str) -> None: ...


class LocalStorageService(StorageService):
    """V1: Local filesystem implementation."""

    def __init__(self, base_path: str = "storage"):
        self.base_path = Path(base_path)

    async def save_video(self, video_id: str, file: UploadFile) -> str:
        path = self.base_path / "videos" / video_id / "original.mp4"
        path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(path, "wb") as f:
            content = await file.read()
            await f.write(content)
        return str(path)


# Future: class S3StorageService(StorageService): ...
```

> [!IMPORTANT]
> All file operations go through `StorageService`. No code outside this service constructs file paths directly. This ensures the S3 migration is a single class swap.

### 4. SQLite with WAL Mode

**Decision:** Use SQLite in WAL (Write-Ahead Logging) mode for better concurrent read performance.

```python
# backend/src/pitchmind/core/database.py

DATABASE_URL = "sqlite+aiosqlite:///./pitchmind.db"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Enable WAL mode for concurrent reads
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_wal(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

WAL mode allows multiple concurrent readers while one writer is active — important when the frontend polls for analysis status while the worker is writing results.

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LIFECYCLE                             │
│                                                                  │
│  1. UPLOAD                                                       │
│     User uploads video                                           │
│     ┌──────────┐    ┌──────────────────────────────────┐         │
│     │ Frontend  │───→│ POST /api/videos/upload          │         │
│     └──────────┘    └──────────┬───────────────────────┘         │
│                                │                                 │
│                     ┌──────────▼───────────┐                     │
│                     │ storage/videos/{id}/ │ ← File saved        │
│                     │ original.mp4         │                     │
│                     └──────────────────────┘                     │
│                     ┌──────────▼───────────┐                     │
│                     │ videos table         │ ← Row created       │
│                     │ status: 'uploaded'   │                     │
│                     └──────────────────────┘                     │
│                                                                  │
│  2. PROCESSING                                                   │
│     Background worker processes video                            │
│                     ┌──────────────────────┐                     │
│                     │ analyses table       │ ← Row created       │
│                     │ status: 'running'    │                     │
│                     └──────────┬───────────┘                     │
│                                │                                 │
│                     ┌──────────▼───────────┐                     │
│                     │ AI Engine processes  │                     │
│                     │ frame extraction     │                     │
│                     │ pose estimation      │                     │
│                     │ biomechanics calc    │                     │
│                     │ coaching generation  │                     │
│                     └──────────┬───────────┘                     │
│                                │                                 │
│                     ┌──────────▼───────────┐                     │
│                     │ storage/frames/{id}/ │ ← Frames saved      │
│                     │ frame_0001.jpg ...   │                     │
│                     └──────────────────────┘                     │
│                                                                  │
│  3. COMPLETION                                                   │
│                     ┌──────────────────────┐                     │
│                     │ analyses table       │ ← Updated           │
│                     │ status: 'completed'  │                     │
│                     │ landmarks_json: {...}│                     │
│                     │ metrics_json: {...}  │                     │
│                     │ coaching_json: {...} │                     │
│                     │ overall_score: 78.5  │                     │
│                     └──────────────────────┘                     │
│                     ┌──────────────────────┐                     │
│                     │ videos table         │ ← Updated           │
│                     │ status: 'completed'  │                     │
│                     │ duration: 4.2        │                     │
│                     │ fps: 30.0            │                     │
│                     │ resolution: 1920x1080│                     │
│                     └──────────────────────┘                     │
│                                                                  │
│  4. DISPLAY                                                      │
│     Frontend fetches results                                     │
│     ┌──────────┐    ┌──────────────────────────────────┐         │
│     │ Frontend  │───→│ GET /api/analyses/{id}           │         │
│     └──────────┘    └──────────────────────────────────┘         │
│                     Returns: metrics + coaching + frames          │
└──────────────────────────────────────────────────────────────────┘
```

---

## JSON Column Schemas

### `metrics_json` Structure

```json
{
  "elbow": {
    "max_backswing_angle": 142.5,
    "min_impact_angle": 168.3,
    "follow_through_angle": 95.2,
    "stability_score": 85.0,
    "is_dropped_elbow": false
  },
  "head": {
    "movement_std_dev_px": 3.2,
    "eye_level_tilt_degrees": 1.8,
    "stability_score": 88.5
  },
  "stance": {
    "width_to_shoulder_ratio": 1.15,
    "balance_score": 76.0
  },
  "footwork": {
    "stride_length_px": 150.0,
    "timing_delay_ms": 120.0
  },
  "hip_shoulder": {
    "peak_separation_degrees": 18.2,
    "separation_at_impact": 14.5,
    "power_score": 85.0
  },
  "knee": {
    "angle_at_impact": 172.5,
    "min_angle": 168.0,
    "is_collapsed": false,
    "brace_score": 90.0
  },
  "wrist": {
    "roll_direction": "supinated",
    "max_roll_delta": 0.04,
    "roll_timing_pct": 0.5,
    "control_score": 88.0
  },
  "centre_of_mass": {
    "max_lateral_sway": 0.015,
    "avg_lateral_sway": 0.010,
    "sway_corridor_px": 12.0,
    "balance_score": 92.0
  },
  "backlift": {
    "peak_height_ratio": 0.75,
    "loop_deviation": 0.02,
    "is_loopy": false,
    "backlift_score": 89.0
  },
  "overall_score": 78.5,
  "stroke_type": "cover_drive",
  "stroke_name": "Front-Foot Cover Drive"
}
```

### `coaching_json` Structure

```json
{
  "insights": [
    {
      "category": "elbow_angle",
      "severity": "positive",
      "title": "Excellent Arm Extension",
      "description": "Your elbow angle reaches 168° at impact, close to the ideal 170-180° range.",
      "recommendation": "Maintain this form. Focus on consistency across deliveries.",
      "source": "rule_based"
    },
    {
      "category": "head_stability",
      "severity": "warning",
      "title": "Minor Head Movement Detected",
      "description": "Lateral head movement of 3.2cm detected during backswing.",
      "recommendation": "Keep your head still and eyes level through the shot.",
      "source": "gemini"
    }
  ],
  "summary": "Strong batting technique with room for improvement in head stability.",
  "gemini_analysis": "Full Gemini response text..."
}
```

### `landmarks_json` Structure

```json
{
  "frames": [
    {
      "index": 0,
      "timestamp_ms": 0.0,
      "landmarks": [
        {"id": 0, "x": 0.521, "y": 0.312, "z": -0.082, "visibility": 0.993},
        {"id": 1, "x": 0.528, "y": 0.298, "z": -0.091, "visibility": 0.987},
        // ... 33 landmarks
      ]
    },
    // ... up to 300 frames
  ],
  "model_complexity": 1,
  "total_frames": 126
}
```

---

## Migration Paths

### SQLite → PostgreSQL

**Trigger:** When multi-user support is needed, or concurrent writes become a bottleneck.

**Steps:**

| Step | Action                                                | Effort     |
| ---- | ----------------------------------------------------- | ---------- |
| 1    | Install `asyncpg`: `pip install asyncpg`              | 1 minute   |
| 2    | Change `DATABASE_URL` in `.env`                       | 1 line     |
| 3    | Update `Column(Text)` JSON columns to `Column(JSON)`  | 3 columns  |
| 4    | Run `alembic upgrade head` against Postgres           | 1 command  |
| 5    | Migrate existing data (optional, V1 data is disposable)| Script     |

```bash
# Before (SQLite)
DATABASE_URL=sqlite+aiosqlite:///./pitchmind.db

# After (PostgreSQL)
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/pitchmind
```

> [!NOTE]
> SQLAlchemy's `Text` type maps to `TEXT` in both SQLite and PostgreSQL. JSON columns should be changed to PostgreSQL-native `JSON`/`JSONB` type for indexing and query capabilities.

### Local Filesystem → S3

**Trigger:** When deploying to cloud, or when file redundancy/CDN is needed.

**Steps:**

| Step | Action                                                      | Effort     |
| ---- | ----------------------------------------------------------- | ---------- |
| 1    | Install `boto3`: `pip install boto3`                        | 1 minute   |
| 2    | Implement `S3StorageService(StorageService)`                | ~100 lines |
| 3    | Update config: `STORAGE_BACKEND=s3`                         | 1 line     |
| 4    | Add S3 credentials to `.env`                                | 3 lines    |
| 5    | Update dependency injection to use `S3StorageService`       | 1 line     |

```python
# backend/src/pitchmind/services/storage_s3.py (future)

class S3StorageService(StorageService):
    def __init__(self, bucket: str, region: str):
        self.s3 = boto3.client("s3", region_name=region)
        self.bucket = bucket

    async def save_video(self, video_id: str, file: UploadFile) -> str:
        key = f"videos/{video_id}/original.mp4"
        self.s3.upload_fileobj(file.file, self.bucket, key)
        return key
```

### FastAPI BackgroundTasks → Celery

**Trigger:** When analysis queue exceeds single-worker capacity, or when you need retry logic, dead letter queues, rate limiting.

| Step | Action                                           | Effort     |
| ---- | ------------------------------------------------ | ---------- |
| 1    | Install Celery + Redis                           | 5 minutes  |
| 2    | Create Celery app config                         | ~30 lines  |
| 3    | Move `run_analysis` to Celery task               | ~20 lines  |
| 4    | Update API endpoint to `task.delay()` instead of `background_tasks.add_task()` | 1 line |

---

## Gitignore Rules

```gitignore
# Storage — all binary assets
storage/

# Database files
*.db
*.db-journal
*.db-wal
*.db-shm

# Alembic auto-generated (keep migrations/, ignore stamps)
alembic/versions/__pycache__/
```

> [!IMPORTANT]
> The `storage/` directory is fully gitignored. Binary assets (videos, frames) must never enter version control. The database file is also gitignored — schema is reproduced via Alembic migrations.

---

## Size Estimates (V1)

| Component               | Per Video    | 100 Videos    | Notes                          |
| ------------------------ | ------------ | ------------- | ------------------------------ |
| Original video           | 10–100 MB    | 1–10 GB       | Largest component              |
| Extracted frames         | 5–30 MB      | 500 MB–3 GB   | JPEG quality 85, key frames    |
| Landmarks JSON           | 0.5–2 MB     | 50–200 MB     | 33 landmarks × 300 frames     |
| Metrics JSON             | ~5 KB        | ~500 KB       | Aggregated metrics only        |
| Coaching JSON            | ~10 KB       | ~1 MB         | Text-based insights            |
| SQLite database          | ~20 KB/row   | ~2 MB         | Metadata + JSON columns        |
| **Total per video**      | **15–130 MB**| **1.5–13 GB** |                                |

> [!NOTE]
> At V1 scale (<100 videos), total storage is well under 15GB — easily fits on any development machine. S3 migration becomes relevant at ~1000 videos or cloud deployment.

---

## Future Improvements

1. **PostgreSQL JSONB** — enables indexing and querying within JSON columns
2. **S3 with CloudFront CDN** — for serving frames to the frontend with caching
3. **Normalized metrics tables** — when analytics/aggregation features are built
4. **Video transcoding** — store multiple resolutions for playback optimization
5. **Soft deletes** — add `deleted_at` column instead of hard deletes
6. **Audit trail** — track who uploaded what and when (post-auth)

---

## Risks / Limitations

| Risk                                         | Likelihood | Impact | Mitigation                                  |
| -------------------------------------------- | ---------- | ------ | ------------------------------------------- |
| SQLite corruption under heavy writes         | Low        | High   | WAL mode, single-writer discipline          |
| Local filesystem data loss                   | Medium     | High   | V1 data is disposable; S3 for production    |
| JSON column size grows unwieldy              | Low        | Medium | Landmarks are bounded (33 × 300 frames max) |
| Disk space exhaustion on dev machine         | Low        | Medium | Monitor usage, delete old analyses          |
| Migration data loss (SQLite → Postgres)      | Low        | Low    | V1 data is dev/test only                    |

---

## Dependencies

| Component       | Depends On                                    |
| --------------- | --------------------------------------------- |
| File storage    | `aiofiles`, local filesystem                  |
| Database        | `sqlalchemy[asyncio]`, `aiosqlite`            |
| Migrations      | `alembic`                                     |
| Future S3       | `boto3` (not installed in V1)                 |
| Future Postgres | `asyncpg` (not installed in V1)               |

---

## Related Systems

- [ADR-001: Technology Stack Selection](./001-tech-stack-selection.md) — why SQLite and local filesystem
- [ADR-002: AI Engine Isolation](./002-ai-engine-isolation.md) — how analysis results flow from AI engine to storage
- [Dev Log #001: Architecture Design](../dev-logs/001-architecture-design.md) — design phase documentation
