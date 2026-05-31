# Dev Log #001 — Architecture Design Phase

| Field    | Value                                              |
| -------- | -------------------------------------------------- |
| Date     | 2025-05-27                                         |
| Author   | PitchMind Engineering                              |
| Status   | **Completed**                                      |
| Category | Development Log                                   |

---

## Summary

This dev log documents the pre-implementation architecture design phase of PitchMind V1. Over this phase, the complete system architecture was designed from scratch — technology stack, project structure, data flow, naming conventions, and development workflow — all before writing a single line of production code.

The philosophy: **spend a day designing, save a month debugging.**

---

## Problem Statement

PitchMind is a cricket batting video analysis platform. Before building anything, we needed to answer:

1. What technologies should we use?
2. How should the code be organized?
3. Where do AI/ML concerns end and web concerns begin?
4. What data do we store and how?
5. What does local development look like?
6. What do we build first?

Without answering these questions upfront, a solo developer building a full-stack AI product risks spaghetti architecture that becomes unmaintainable within weeks.

---

## Work Completed

### 1. Defined V1 Product Scope

**Decision:** V1 is batting analysis only. No bowling, fielding, wicketkeeping, or team analytics.

| In Scope (V1)                          | Out of Scope (V1)                |
| -------------------------------------- | -------------------------------- |
| Upload batting video                   | Authentication / user accounts   |
| Extract video frames                   | Multi-tenant support             |
| Run pose estimation (MediaPipe)        | Bowling analysis                 |
| Calculate elbow angle                  | Fielding analysis                |
| Calculate head stability               | Real-time streaming              |
| Calculate stance metrics               | Mobile application               |
| Calculate footwork metrics             | PDF report export                |
| Generate AI coaching insights          | Payment processing               |
| Score batting technique (0-100)        | Admin panel                      |
| Visualize analytics in dashboard       | Custom ML model training         |

> [!IMPORTANT]
> Scope discipline is the most important decision at this stage. Every feature not built is a month of development saved. V1 ships a single, complete vertical: batting video → coaching insights.

### 2. Designed Three-Layer System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PITCHMIND V1 ARCHITECTURE                    │
│                                                                 │
│  Layer 1: FRONTEND (Next.js 15 + TypeScript)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ App Router │ Zustand Stores │ Recharts │ Framer Motion    │ │
│  │ Pages      │ API hooks      │ Charts   │ Animations       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │ HTTP (REST + WebSocket)              │
│                          ▼                                      │
│  Layer 2: BACKEND (FastAPI + SQLAlchemy)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ API Routes │ Services │ Workers │ Schemas │ Models        │ │
│  │ /api/      │ Business │ Async   │ Pydantic│ SQLAlchemy    │ │
│  │ videos     │ logic    │ tasks   │ I/O     │ ORM           │ │
│  │ analyses   │          │         │         │               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │ Python import (pip install -e)       │
│                          ▼                                      │
│  Layer 3: AI ENGINE (Pure Python)                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ BattingPipeline │ Frame Extraction │ Pose Estimation      │ │
│  │ (entry point)   │ OpenCV           │ MediaPipe            │ │
│  │                 │                  │                      │ │
│  │ Biomechanics    │ Coaching         │ Models               │ │
│  │ Calculator      │ Gemini + Rules   │ Dataclasses          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural principle:** Dependencies flow in one direction only — Frontend → Backend → AI Engine. The AI engine knows nothing about the web layer. See [ADR-002](../decisions/002-ai-engine-isolation.md).

### 3. Selected Complete Technology Stack

Full rationale documented in [ADR-001: Technology Stack Selection](../decisions/001-tech-stack-selection.md).

Summary of key choices:

| Layer      | Key Technology   | Runner-Up     | Decisive Factor                   |
| ---------- | ---------------- | ------------- | --------------------------------- |
| Frontend   | Next.js 15       | Vite + React  | SSR, file routing, Vercel deploy  |
| State      | Zustand          | Redux Toolkit | 5 lines vs. 15 lines per store    |
| Backend    | FastAPI          | Django        | Async-native, Pydantic, auto docs |
| Database   | SQLite           | PostgreSQL    | Zero-ops for single-user V1       |
| Pose       | MediaPipe        | OpenPose      | CPU-only, free, pip install       |
| AI Coach   | Gemini API       | OpenAI GPT-4  | Google ecosystem, structured JSON |

### 4. Defined Monorepo Structure

```
pitchmind/
├── frontend/                 # Next.js 15 application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Feature-specific components
│   │   ├── stores/          # Zustand state management
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities, API client
│   │   └── styles/          # Global CSS, design tokens
│   ├── public/              # Static assets
│   ├── package.json
│   └── next.config.js
│
├── backend/                  # FastAPI application
│   ├── src/
│   │   └── pitchmind/
│   │       ├── api/         # Route handlers
│   │       ├── models/      # SQLAlchemy models
│   │       ├── schemas/     # Pydantic schemas
│   │       ├── services/    # Business logic
│   │       ├── workers/     # Background task handlers
│   │       └── core/        # Config, database, deps
│   ├── tests/
│   ├── alembic/             # Database migrations
│   └── pyproject.toml
│
├── ai-engine/                # Pure Python AI package
│   ├── src/
│   │   └── pitchmind_ai/
│   │       ├── pipeline.py  # BattingPipeline entry point
│   │       ├── extractors/  # Frame extraction
│   │       ├── pose/        # MediaPipe pose estimation
│   │       ├── biomechanics/# Angle & metric calculations
│   │       ├── coaching/    # Gemini + rule-based insights
│   │       └── models.py    # Dataclass result types
│   ├── tests/
│   └── pyproject.toml
│
├── docs/                     # Documentation (this directory)
│   └── notion/
│       ├── decisions/       # Architecture Decision Records
│       ├── dev-logs/        # Development logs
│       └── roadmap/         # Planning documents
│
└── storage/                  # Binary assets (gitignored)
    ├── videos/
    ├── frames/
    └── exports/
```

### 5. Designed Frontend Architecture

| Aspect          | Decision                                           |
| --------------- | -------------------------------------------------- |
| Routing         | App Router (file-based, `/app/` directory)         |
| Pages           | `/` (landing), `/upload`, `/dashboard`, `/analysis/[id]` |
| State           | Zustand stores per feature (upload, analysis, ui)  |
| API layer       | Custom hooks wrapping `fetch()`, no axios           |
| Styling         | Vanilla CSS with CSS custom properties (design tokens) |
| Components      | Atomic design: atoms → molecules → organisms       |
| Charts          | Recharts for all data visualizations               |
| Animations      | Framer Motion for page transitions, skeleton loaders|

### 6. Designed Backend Architecture

| Aspect          | Decision                                           |
| --------------- | -------------------------------------------------- |
| API prefix      | `/api/v1/`                                         |
| Endpoints       | `POST /videos/upload`, `GET /videos`, `GET /videos/{id}`, `GET /analyses/{id}`, `WS /ws/analysis/{id}` |
| Service layer   | `VideoService`, `AnalysisService`, `StorageService`|
| Worker          | `analysis_worker.py` — single bridge to AI engine  |
| Validation      | Pydantic v2 schemas for all request/response       |
| Error handling  | Custom exception handlers, structured error responses |
| CORS            | Allow `localhost:3000` in development               |

### 7. Designed AI Engine Architecture

| Component       | Responsibility                                     |
| --------------- | -------------------------------------------------- |
| `pipeline.py`   | Orchestrates the full analysis pipeline             |
| `extractors/`   | Frame extraction from video (OpenCV)               |
| `pose/`         | Pose estimation (MediaPipe), landmark extraction   |
| `biomechanics/` | Angle calculations, stability metrics, scoring     |
| `coaching/`     | Rule-based + Gemini coaching insight generation    |
| `models.py`     | All dataclass definitions (zero dependencies)      |

### 8. Defined Complete Data Flow

```
User uploads video
    │
    ▼
POST /api/v1/videos/upload
    │  ← Save file to storage/videos/{id}/
    │  ← Create video row (status: uploaded)
    │  ← Create analysis row (status: pending)
    │  ← Trigger BackgroundTask
    │
    ▼
analysis_worker.run_analysis()
    │  ← Update analysis status: running
    │  ← WebSocket: notify frontend
    │
    ▼
BattingPipeline.analyze(video_path)
    │
    ├── Frame extraction (OpenCV)
    │   └── Save key frames to storage/frames/{id}/
    │
    ├── Pose estimation (MediaPipe)
    │   └── 33 landmarks per frame
    │
    ├── Biomechanics calculation (NumPy)
    │   ├── Elbow angle (backswing, impact, follow-through)
    │   ├── Head stability (lateral, vertical movement)
    │   ├── Stance (width, weight distribution, knee bend)
    │   └── Footwork (stride, pivot, timing)
    │
    ├── Scoring (0-100 composite)
    │
    └── Coaching generation
        ├── Rule-based insights (immediate)
        └── Gemini AI analysis (async call)
    │
    ▼
Return BattingAnalysisResult (dataclass)
    │
    ▼
analysis_worker converts to DB models
    │  ← Update analysis row with results
    │  ← Update video status: completed
    │  ← WebSocket: notify frontend
    │
    ▼
Frontend polls / receives WebSocket update
    │
    ▼
GET /api/v1/analyses/{id}
    │
    ▼
Dashboard renders metrics, charts, coaching insights
```

### 9. Defined Storage Strategy

Fully documented in [ADR-003: Data Storage Strategy](../decisions/003-data-storage-strategy.md).

Key decisions:
- Local filesystem for binary assets (StorageService abstraction)
- SQLite for metadata (WAL mode, UUID primary keys)
- JSON columns for evolving schemas (metrics, landmarks, coaching)
- Clear migration paths to PostgreSQL and S3

### 10. Established Naming Conventions

| Layer      | Convention                  | Example                                   |
| ---------- | --------------------------- | ----------------------------------------- |
| Frontend   | camelCase (TS/JS standard)  | `useAnalysisStore`, `UploadPage`          |
| Components | PascalCase                  | `MetricsCard`, `ElbowAngleChart`          |
| CSS        | kebab-case with BEM         | `.metrics-card__title--highlighted`        |
| Backend    | snake_case (Python PEP 8)  | `video_service.py`, `get_analysis_by_id`  |
| API routes | kebab-case URLs             | `/api/v1/videos/upload`                   |
| Database   | snake_case (SQL convention) | `videos`, `file_size_bytes`, `created_at` |
| AI Engine  | snake_case (Python PEP 8)  | `batting_pipeline`, `elbow_angle_metrics` |
| Files      | snake_case (Python), kebab-case (TS) | `analysis_worker.py`, `use-upload.ts` |

### 11. Defined Local Development Workflow

| Component   | Command                     | Port   | Hot Reload |
| ----------- | --------------------------- | ------ | ---------- |
| Frontend    | `npm run dev`               | 3000   | ✅ (Next.js)|
| Backend     | `uvicorn pitchmind.main:app --reload` | 8000 | ✅ (uvicorn)|
| API Docs    | Auto-served by FastAPI      | 8000/docs | ✅       |
| AI Engine   | Imported by backend         | —      | ✅ (editable install) |
| Database    | Auto-created by Alembic     | —      | N/A        |

### 12. Listed Required Installations (Windows)

| Tool          | Purpose                   | Install Command                           |
| ------------- | ------------------------- | ----------------------------------------- |
| Node.js 20+   | Frontend runtime          | `winget install OpenJS.NodeJS.LTS`        |
| Python 3.11+  | Backend + AI runtime      | `winget install Python.Python.3.11`       |
| Git           | Version control           | `winget install Git.Git`                  |
| VS Code       | IDE                       | `winget install Microsoft.VisualStudioCode`|

### 13. Defined Dependency Strategy

| Package        | Dependency Strategy                          |
| -------------- | -------------------------------------------- |
| `frontend`     | `package.json` with pinned major versions    |
| `backend`      | `pyproject.toml` with `>=` minimum versions  |
| `ai-engine`    | `pyproject.toml` with exact pinned versions  |
| Backend → AI   | `pip install -e ../ai-engine` (editable)     |

> [!NOTE]
> The AI engine pins exact versions because ML library behavior can change between minor versions (MediaPipe landmark positions, model accuracy). The web layers use minimum versions for easier updates.

### 14. Established Development Principles

| Principle                        | Explanation                                                    |
| -------------------------------- | -------------------------------------------------------------- |
| **Vertical slicing**            | Build features top-to-bottom (AI → API → UI), not layer-by-layer |
| **AI-first development**        | Build the AI pipeline first, validate it works, then build the web app around it |
| **No speculative generalization**| Don't build abstractions until there are 3+ concrete uses      |
| **Explicit over implicit**      | Configuration over convention. No magic.                       |
| **Isolation over integration**  | Each layer is independently testable and deployable            |
| **Documentation as code**       | Architecture decisions documented in version-controlled markdown|

---

## Key Decisions Made

| #  | Decision                                | Rationale                                           | ADR Reference |
| -- | --------------------------------------- | --------------------------------------------------- | ------------- |
| 1  | No microservices for V1                 | Single developer, single machine, unnecessary complexity | ADR-001     |
| 2  | AI engine is pure Python (no web deps)  | Testability, portability, team independence           | ADR-002       |
| 3  | SQLite database (not Postgres)          | Zero-ops, sufficient for single-user V1              | ADR-001       |
| 4  | BackgroundTasks (not Celery)            | No Redis broker dependency, sufficient for V1        | ADR-001       |
| 5  | Local filesystem (not S3)              | Zero-ops, StorageService abstraction for migration   | ADR-003       |
| 6  | No authentication in V1                | Single-user product, no multi-tenant complexity      | —             |
| 7  | Vertical slice development             | Ship working features, not partially-built layers    | —             |
| 8  | JSON columns for metrics               | Schema evolving rapidly, avoid premature normalization| ADR-003       |
| 9  | Monorepo structure                     | Shared tooling, atomic commits, easier dependency management | —     |
| 10 | CSS custom properties (not Tailwind)   | Full design system control for data-dense dashboards | ADR-001       |

---

## Lessons Learned

1. **Architecture time is never wasted.** Every hour spent designing saves days of refactoring.
2. **The AI isolation boundary is the most valuable decision.** It prevents the entire codebase from becoming a tangled mess of ML and web code.
3. **SQLite is massively underrated** for early-stage products. Zero-ops is a superpower.
4. **Scope discipline is hard but essential.** The temptation to add bowling analysis, auth, and PDF export is strong. Resist.
5. **Document decisions when they're fresh.** ADRs written during design are 10x better than ADRs reconstructed from memory months later.

---

## Time Spent

| Activity                          | Duration    |
| --------------------------------- | ----------- |
| Product scope definition          | 1 hour      |
| Technology research & selection   | 3 hours     |
| Architecture design               | 2 hours     |
| Project structure design          | 1 hour      |
| Data model design                 | 1 hour      |
| Documentation (ADRs, dev log)     | 2 hours     |
| **Total**                         | **~10 hours**|

---

## Next Steps

| #  | Task                                                | Priority | Estimated Time |
| -- | --------------------------------------------------- | -------- | -------------- |
| 1  | Scaffold monorepo structure (all directories/files) | P0       | 2 hours        |
| 2  | Install all dependencies (frontend + backend + AI)  | P0       | 1 hour         |
| 3  | Build AI pipeline — frame extraction                | P0       | 4 hours        |
| 4  | Build AI pipeline — pose estimation                 | P0       | 4 hours        |
| 5  | Build AI pipeline — elbow angle calculation         | P0       | 3 hours        |
| 6  | Unit tests for AI pipeline                          | P0       | 2 hours        |
| 7  | Backend API — video upload endpoint                 | P1       | 3 hours        |
| 8  | Backend API — analysis trigger + worker             | P1       | 4 hours        |
| 9  | Frontend — upload page                              | P1       | 4 hours        |
| 10 | Frontend — analysis dashboard                       | P1       | 6 hours        |

> [!IMPORTANT]
> **Build order matters.** The AI pipeline is the core product. If the AI doesn't work, nothing else matters. Build and validate the pipeline first, then wrap it in a web application.

---

## Risks Identified

| Risk                                       | Likelihood | Impact | Mitigation                                   |
| ------------------------------------------ | ---------- | ------ | -------------------------------------------- |
| MediaPipe accuracy insufficient for cricket| Medium     | High   | Test with real batting videos early            |
| Scope creep beyond batting analysis        | High       | Medium | Strict V1 scope, defer all non-batting work   |
| Solo developer burnout                     | Medium     | High   | Ship small vertical slices, celebrate wins     |
| Technology choices need revision           | Low        | Medium | All choices are reversible (see ADR-001)       |

---

## Related Systems

- [ADR-001: Technology Stack Selection](../decisions/001-tech-stack-selection.md)
- [ADR-002: AI Engine Isolation](../decisions/002-ai-engine-isolation.md)
- [ADR-003: Data Storage Strategy](../decisions/003-data-storage-strategy.md)
- [V1 Development Roadmap](../roadmap/001-v1-development-roadmap.md)
