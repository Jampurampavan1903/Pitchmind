# PitchMind V1 — System Architecture

| Metadata | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Author** | Principal Architect |
| **Status** | Approved |
| **Category** | System Architecture |

---

## 1. Summary

PitchMind V1 is a batting-only cricket video analysis platform. It provides an automated, AI-driven technique evaluation system. A user uploads a video of their batting session, the system processes it to extract frames, runs pose estimation, computes biomechanical metrics (elbow angles, head stability, stance, and footwork), generates natural language coaching insights, and displays them on a visual web dashboard.

---

## 2. Problem Statement

Cricket batting technique is highly technical and requires precise physical alignment. Aspiring cricket players face significant hurdles in improving their technique:
1. **High Cost of Coaching:** Professional 1-on-1 coaching is expensive and inaccessible for many players.
2. **Subjectivity:** Human coaching feedback is often subjective and lacks precise quantitative data.
3. **Lack of Tools:** Existing video analysis software is either manual (requires frame-by-frame annotation by a human coach) or doesn't provide automated biomechanical metrics.

PitchMind V1 solves this by automating the capture, calculation, and evaluation of key batting biomechanics, making high-performance feedback accessible to any player with a smartphone camera.

---

## 3. Architecture Explanation

PitchMind uses a modular monorepo structure containing three distinct layers with clean boundaries:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│   ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│   │  Upload   │  │  Dashboard   │  │  Analytics   │  │  Reports  │  │
│   │  Module   │  │    View      │  │   Panels     │  │   View    │  │
│   └────┬─────┘  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │
└────────┼───────────────┼─────────────────┼───────────────┼──────────┘
         │               │                 │               │
    ─────┼───────────────┼─────────────────┼───────────────┼──────────
         │           REST / WebSocket                      │
    ─────┼───────────────┼─────────────────┼───────────────┼──────────
         │               │                 │               │
┌────────┼───────────────┼─────────────────┼───────────────┼──────────┐
│        ▼               ▼                 ▼               ▼          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    BACKEND (FastAPI)                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │  Upload    │  │  Analysis  │  │  Report / Metrics      │  │   │
│  │  │  Service   │  │  Orchestr. │  │  Service               │  │   │
│  │  └─────┬──────┘  └─────┬──────┘  └────────────────────────┘  │   │
│  └────────┼───────────────┼─────────────────────────────────────┘   │
│           │               │                                         │
│           │        ┌──────▼───────┐                                 │
│           │        │  Task Queue  │  (Background worker)            │
│           │        └──────┬───────┘                                 │
│           │               │                                         │
│  ┌────────▼───────────────▼─────────────────────────────────────┐   │
│  │                   AI ENGINE (Python)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │   │
│  │  │  Frame   │  │   Pose   │  │  Biomech │  │  Coaching   │  │   │
│  │  │  Extract  │  │  Estim.  │  │  Engine  │  │  Insights   │  │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │   │
│  └───────┼──────────────┼─────────────┼───────────────┼─────────┘   │
│          │              │             │               │              │
│  ┌───────▼──────────────▼─────────────▼───────────────▼─────────┐   │
│  │                     STORAGE LAYER                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐ │   │
│  │  │  File Store  │  │  Database   │  │  Cache (optional V1)  │ │   │
│  │  │  (local/S3)  │  │  (SQLite →  │  │                       │ │   │
│  │  │              │  │   Postgres) │  │                       │ │   │
│  │  └──────────────┘  └─────────────┘  └───────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

1. **Frontend (Next.js 15 App Router):** A modern React dashboard for uploading videos, monitoring processing in real-time, and visualizing pose overlays, metrics charts, and coaching reports.
2. **Backend (FastAPI):** A high-performance Python backend serving REST APIs and WebSockets. It handles file upload orchestration, manages video/analysis state in the database, and schedules video analysis on an async background worker.
3. **AI Engine (Pure Python Library):** A computational package completely isolated from the web layers. It handles OpenCV frame extraction, MediaPipe pose tracking, coordinate smoothing, joint angle mathematical calculations, and LLM-powered coaching via Gemini.

---

## 4. Technical Decisions

| Decision Area | Chosen Technology | Alternatives | Rationale |
|---|---|---|---|
| **API Framework** | **FastAPI** | Django, Flask | High performance, async native, automatic Swagger docs, Pydantic type validation. Best suited for ML workflows. |
| **Database** | **SQLite (V1)** | PostgreSQL | Zero setup needed for development. SQLAlchemy ORM ensures a seamless one-line config migration to Postgres later. |
| **Task Queue** | **FastAPI BackgroundTasks** | Celery + Redis | Minimizes infrastructure complexity for V1. Easy to swap in Celery once scaling demands it. |
| **Pose Estimation** | **MediaPipe Pose** | OpenPose, MMPose | Fast, runs efficiently on standard CPU (no GPU host required), robust 33-landmark skeleton tracking, zero cost. |
| **LLM Coaching** | **Gemini API** | GPT-4o, Claude 3.5 | Superior structured JSON reasoning capabilities, great integration in the Google developer ecosystem. |
| **File Storage** | **Local Filesystem** | AWS S3, Cloudinary | Simplifies early setup. Uses a modular `StorageService` abstraction so switching to S3 is a simple configuration change. |

---

## 5. File Structure

The system is organized as a clean **Monorepo** dividing the layers:
- `frontend/` — Next.js client-side application
- `backend/` — FastAPI application and async worker
- `ai-engine/` — Isolated Python package installed in editable mode (`pip install -e`)
- `shared/` — Common constants and API schemas
- `storage/` — Local directory for video and frame files (gitignored)

---

## 6. Real-time Data Workflow

1. **Upload:** Client uploads video (`POST /api/v1/upload`) → backend saves file to `storage/videos/{id}` → creates DB record → triggers async background task.
2. **Real-time Status:** Client opens a WebSocket (`/api/v1/ws/{id}`) to receive granular status updates (e.g., `extracting_frames`, `pose_estimation`, `calculating_metrics`, `generating_insights`).
3. **AI Pipeline Execution:**
   - Frame extractor decodes video, samples keyframes, and saves them to `storage/frames/{id}`.
   - Pose Estimator extracts 33 landmarks for each frame.
   - Biomechanics engine computes joint angles (elbow, knee), head tilt, stance width, and stride.
   - Coaching engine evaluates rule-based metrics and sends JSON to the Gemini API for natural-language coaching insights.
4. **Completion:** Results are saved as JSON fields in the SQLite database → background worker notifies the WebSocket connection → client fetches complete metrics and visuals.

---

## 7. Future Improvements & Deferrals

- **PostgreSQL Migration:** Move to Postgres when user concurrency demands concurrent writes.
- **Distributed Workers:** Replace background tasks with Celery and Redis to execute analysis on separate GPU/CPU worker instances.
- **S3 Storage:** Transition local folders to AWS S3 or Google Cloud Storage.
- **Multi-Player Support:** Add team rosters, coaching dashboards, and historical progression reports.
