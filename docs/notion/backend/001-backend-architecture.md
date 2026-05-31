# PitchMind — Backend Architecture

| Metadata | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Author** | Lead Backend Engineer |
| **Status** | Approved |
| **Category** | Backend Architecture |

---

## 1. Summary

The PitchMind backend is built on **FastAPI**, **SQLAlchemy 2.0**, and **Pydantic v2**. It handles client video uploads, coordinates the database state, manages background processing tasks, and utilizes WebSockets to broadcast real-time updates to the web client. The backend isolates the compute-heavy computer vision analysis pipeline using an async background task orchestration framework.

---

## 2. Technical Decisions & Rationale

- **FastAPI Framework:** Extremely fast, modern, and async-native. Built-in Pydantic integration automatically handles data validation, request sanitization, and OpenAPI document generation. It is the premier choice for Python ML integrations.
- **SQLite Database:** Perfect for our lightweight, single-user V1. Using **SQLAlchemy 2.0** as our ORM and **Alembic** for migrations guarantees we can seamlessly shift our database URL to **PostgreSQL** in production with zero code refactoring.
- **FastAPI BackgroundTasks:** Instead of building a complex Celery + Redis worker cluster during early development, the backend leverages FastAPI's built-in background tasks. This is highly efficient and operates within the same application process, keeping our infrastructure minimal.
- **WebSocket Protocol:** Traditional REST polling is highly inefficient. We utilize WebSockets to establish a persistent connection with the client during video analysis, pushing instant percentage and stage changes (e.g. `extracting_frames` → `pose_estimation`).

---

## 3. Directory Layout

The backend is laid out as follows:

```
backend/app/
│
├── main.py                               # Application entry, CORS, startup/shutdown
│
├── core/                                 # App-wide Configurations
│   ├── config.py                         # Environment variables (Pydantic Settings)
│   ├── database.py                       # SQLAlchemy database engine and session
│   ├── dependencies.py                   # Dependency Injection (database, storage)
│   └── exceptions.py                     # Custom HTTP exceptions and handlers
│
├── api/                                  # HTTP & WebSocket Controllers
│   └── v1/
│       ├── upload.py                     # Video upload and status endpoints
│       ├── analysis.py                   # Data retrieval (metrics, insights, frames)
│       └── ws.py                         # WebSocket real-time connections
│
├── schemas/                              # Pydantic Request/Response Models
│   ├── upload.py                         # Upload schemas
│   └── analysis.py                       # Biomechanical metrics data shapes
│
├── models/                               # Database ORM Classes
│   ├── base.py                           # Base database mixins
│   ├── video.py                          # Video table definition
│   └── analysis.py                       # Analysis table definition
│
├── services/                             # Core Business Logic Layer
│   ├── upload_service.py                 # File system saves and validations
│   ├── analysis_service.py               # ORM reads/writes and metrics logic
│   ├── storage_service.py                # Abstraction for Local / Cloud saving
│   └── report_service.py                 # Formulates metrics data summaries
│
└── workers/                              # Worker Tasks (Executes AI pipeline)
    └── analysis_worker.py                # Bridges backend system and AI package
```

---

## 4. Database Schema Structure (SQLite)

We structure our tables in SQLite, storing heavy arrays and structures (like skeletal coordinates and coaching insights) using JSON fields:

```sql
-- Represents raw video files uploaded by players
CREATE TABLE videos (
    id TEXT PRIMARY KEY,                  -- UUID
    filename TEXT NOT NULL,               -- Unique filesystem name
    original_name TEXT NOT NULL,          -- User's original file name
    file_path TEXT NOT NULL,              -- System location
    file_size_bytes INTEGER NOT NULL,
    duration_seconds REAL,                -- Populated post-extraction
    fps REAL,
    resolution TEXT,
    status TEXT NOT NULL,                 -- 'uploaded', 'processing', 'complete', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Represents detailed biomechanical analysis reports
CREATE TABLE analyses (
    id TEXT PRIMARY KEY,                  -- UUID
    video_id TEXT NOT NULL,               -- FK referencing videos(id)
    status TEXT NOT NULL,
    landmarks_json TEXT,                  -- Huge array of raw joint coordinates
    metrics_json TEXT,                    -- Key angles, head, footwork data
    coaching_json TEXT,                   -- Gemini-generated recommendations
    frame_count INTEGER NOT NULL,
    processing_time_seconds REAL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX idx_analyses_video_id ON analyses(video_id);
```

---

## 5. API Design

| Method | Endpoint | Request Body | Response JSON | Purpose |
|---|---|---|---|---|
| `POST` | `/api/v1/upload` | `multipart/form-data` | `{ "video_id": "...", "status": "uploaded" }` | Upload raw batting footage. |
| `GET` | `/api/v1/upload/{id}/status` | — | `{ "video_id": "...", "status": "...", "progress_pct": 50 }` | Polling fallback for status. |
| `GET` | `/api/v1/analyses` | — | `{ "analyses": [...] }` | List recent batting analysis logs. |
| `GET` | `/api/v1/analysis/{id}` | — | `AnalysisResponse` | Fetch full landmarks, metrics, and insights. |
| `GET` | `/api/v1/analysis/{id}/frames` | — | `{ "frames": [...] }` | Fetch image paths and timestamps. |
| `WS` | `/api/v1/ws/{id}` | — | Status Update Stream | Persistent real-time connection. |

---

## 6. Service & Worker Layer Boundaries

To protect the architecture against drift, the backend maintains strict boundaries:
1. **HTTP Sanitization:** API route controllers are completely thin. They handle authentication, validate schemas, parse parameters, and immediately delegate all business logic to `services/`.
2. **AI Isolation Bridge:** The `workers/analysis_worker.py` is the **only** file in the backend allowed to import from the `ai-engine` package. When a video is uploaded, `upload_service` saves the file and `analysis_worker` triggers the AI pipeline. It handles the coordinate math, extracts frames, saves results to the database, and closes the loop without leaking ML packages into other services.
3. **Storage Abstraction:** The `storage_service` defines a contract for reading, writing, and deleting files. Services never write files using standard Python `open()`. They call `storage_service.save_file()`, ensuring that moving files from local folders to S3 is handled seamlessly.
