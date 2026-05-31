# ADR-001 — Technology Stack Selection

| Field    | Value                                              |
| -------- | -------------------------------------------------- |
| Date     | 2025-05-27                                         |
| Author   | PitchMind Engineering                              |
| Status   | **Accepted**                                       |
| Category | Architecture Decision Record                      |

---

## Summary

This ADR documents the complete technology selection rationale for PitchMind V1 — a cricket batting video analysis platform. Every technology was chosen deliberately, weighing developer velocity, production readiness, AI/ML ergonomics, and V1 constraints (single developer, zero-ops, rapid iteration).

---

## Problem Statement

PitchMind V1 must ship a working end-to-end product: video upload → pose estimation → biomechanics analysis → AI coaching → analytics dashboard. The stack must optimize for:

1. **Speed of iteration** — solo developer, startup pace
2. **AI/ML-first architecture** — the AI pipeline is the core product, not CRUD
3. **Zero-ops V1** — no Docker, no Kubernetes, no managed databases
4. **Production path** — every choice must scale to Series A without a rewrite

---

## Decision

The technology stack is organized into four layers: Frontend, Backend, AI Engine, and Infrastructure. Each choice is documented below with alternatives considered and rationale.

---

## Frontend Stack

| Technology      | Chosen            | Alternatives Considered          | Why Chosen                                                                                                   |
| --------------- | ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework       | **Next.js 16**    | Vite + React, CRA, Remix, Astro | SSR/SSG flexibility, file-based routing, built-in image optimization, API routes for BFF patterns, Turbopack support. App Router is standard. |
| Language        | **TypeScript**    | JavaScript                       | Non-negotiable. Type safety catches bugs before runtime. IntelliSense makes development faster, not slower. Every serious frontend project uses TS in 2025. |
| State Mgmt      | **Zustand**       | Redux Toolkit, React Context, Jotai, Valtio | Minimal boilerplate (~5 lines for a store), no Provider wrappers, scales cleanly from simple to complex, excellent TypeScript support, tiny bundle (1KB). Redux is overkill for V1. Context causes unnecessary re-renders. |
| Charts          | **Recharts**      | D3.js, Chart.js, Nivo, Victory   | React-native (JSX components, not imperative DOM), composable API, responsive out of the box, good defaults for dashboards. D3 is too low-level. Chart.js wraps poorly in React. |
| Animation       | **Framer Motion** | React Spring, GSAP, CSS animations | Declarative API, layout animations, gesture support, exit animations (AnimatePresence), premium feel with minimal code. Essential for a product that visualizes body movement. |
| Styling         | **Vanilla CSS**   | Tailwind CSS, CSS Modules, styled-components, Emotion | Full control over design tokens via CSS custom properties, no build-time dependency, no className clutter, design system variables cascade naturally. Tailwind's utility-first approach fights custom design systems. |

### Frontend Decision Rationale — Deep Dive

#### Next.js 16 over Vite

Vite is excellent for SPAs but PitchMind needs:
- **SSR** for the marketing/landing page (SEO)
- **Image optimization** for pose overlay frames (next/image)
- **File-based routing** reduces boilerplate vs. react-router
- **API routes** enable lightweight BFF patterns without a separate server
- **Turbopack compiler** is extremely fast (under 200ms dev rebuilds)

> [!NOTE]
> Next.js 16 with App Router is the default choice for new React projects.


#### Zustand over Redux

```
// Redux Toolkit: ~15 lines for a simple counter
// Zustand: 5 lines
const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));
```

- No `<Provider>` wrapper required
- No action types, reducers, selectors boilerplate
- Built-in middleware (devtools, persist, immer)
- Jotai is atomic (bottom-up) — Zustand is store-based (top-down), better for dashboard state

#### Vanilla CSS over Tailwind

This is the most contentious choice. Rationale:

1. **Design tokens** — CSS custom properties (`--color-primary`, `--spacing-md`) cascade naturally through the DOM. Tailwind requires `tailwind.config.js` indirection.
2. **Component styles** — dashboard widgets need precise, custom styling. Utility classes become unreadable at this complexity.
3. **No build dependency** — CSS works everywhere. No PostCSS, no purging, no JIT compiler.
4. **Design system control** — PitchMind's visual identity (dark theme, data-dense dashboards, cricket-specific color coding) needs full CSS control.

> [!IMPORTANT]
> This is a V1 decision. If the team grows beyond 3 frontend developers, CSS Modules or Tailwind may be reconsidered for consistency enforcement.

---

## Backend Stack

| Technology   | Chosen              | Alternatives Considered              | Why Chosen                                                                                                       |
| ------------ | ------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Framework    | **FastAPI**         | Django, Flask, Express.js, NestJS    | Async-native, automatic OpenAPI docs, Pydantic integration, best Python framework for ML backends. Django is too batteries-included. Flask lacks async. Express means Node (wrong ecosystem for ML). |
| ORM          | **SQLAlchemy 2.0**  | Tortoise ORM, Prisma, Django ORM     | Industry standard, async support (2.0), Alembic for migrations, massive community, works with every database. Tortoise is immature. Prisma is Node-first. |
| Database     | **SQLite**          | PostgreSQL, MySQL, MongoDB           | Zero setup, single file, perfect for single-user V1. No database server to manage. Migration to Postgres is a one-line config change with SQLAlchemy. |
| Migrations   | **Alembic**         | Manual SQL, Django migrations        | Standard SQLAlchemy migration tool. Auto-generates migrations from model changes. Version-controlled schema evolution. |
| Validation   | **Pydantic v2**     | marshmallow, attrs, cerberus         | Rust-powered core (10-50x faster than v1), native FastAPI integration, JSON Schema generation, excellent TypeScript type generation potential. |

### Backend Decision Rationale — Deep Dive

#### FastAPI over Django

Django brings authentication, admin panel, template rendering, and an ORM — none of which PitchMind V1 needs from the web framework. FastAPI provides exactly what's needed:

```
Needed for PitchMind V1:          FastAPI    Django
─────────────────────────────────────────────────────
Async request handling              ✅         ⚠️ (ASGI bolt-on)
Auto OpenAPI/Swagger docs           ✅         ❌ (DRF addon)
Pydantic validation                 ✅         ❌ (serializers)
Background task processing          ✅         ❌ (Celery required)
WebSocket support                   ✅         ⚠️ (Channels addon)
File upload handling                ✅         ✅
ML pipeline integration             ✅         ✅
```

> [!NOTE]
> FastAPI's `BackgroundTasks` eliminates the need for Celery + Redis in V1. A video analysis job is submitted and processed in-process. This is sufficient for single-user, single-server operation.

#### SQLite over PostgreSQL

For V1, PostgreSQL adds operational complexity with zero benefit:

| Concern                 | SQLite              | PostgreSQL                    |
| ----------------------- | ------------------- | ----------------------------- |
| Setup time              | 0 seconds           | Install + configure + create DB |
| Concurrent writes       | Single writer        | Full MVCC                     |
| Deployment              | File in repo         | Managed service ($)           |
| Backup                  | Copy file            | pg_dump                       |
| Performance (V1 scale)  | Identical            | Identical                     |
| Migration effort        | —                    | Change `DATABASE_URL`         |

PitchMind V1 is single-user, single-server. SQLite handles this perfectly. When concurrent writes matter (multi-user, team features), the migration is mechanical.

#### SQLAlchemy 2.0

Version 2.0 brings:
- Native `async` support (via `asyncio` extension)
- New-style declarative models (closer to dataclasses)
- Better type annotation support
- Statement-level caching for performance

---

## AI Engine Stack

| Technology      | Chosen                | Alternatives Considered              | Why Chosen                                                                                                     |
| --------------- | --------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Pose Estimation | **MediaPipe Pose**    | OpenPose, MMPose, AlphaPose, custom  | CPU-only inference (no GPU required), free/open-source, 33 body landmarks, real-time performance, Google-maintained, pip install. OpenPose needs CUDA. MMPose is complex to deploy. |
| Video/Image     | **OpenCV**            | Pillow, scikit-image, FFmpeg direct  | Industry standard for video processing, frame extraction, image manipulation. No realistic alternative for video I/O in Python. |
| Math            | **NumPy**             | SciPy, pandas, manual math           | Sufficient for angle calculations, vector operations, statistical aggregation. SciPy is overkill — we need `arctan2` and `mean`, not differential equations. |
| AI Coaching     | **Gemini API**        | OpenAI GPT-4, Claude, Llama, Mistral | Best structured reasoning for coaching analysis, Google ecosystem alignment (MediaPipe), generous free tier, excellent JSON mode for structured output. |
| Data Modeling   | **Python dataclasses**| Pydantic, attrs, TypedDict           | Zero framework dependency keeps AI engine portable. Dataclasses are stdlib — no pip install needed. Pydantic belongs in the web layer, not the AI layer. |

### AI Engine Decision Rationale — Deep Dive

#### MediaPipe Pose over OpenPose

This is the most critical technology choice in the stack. MediaPipe wins decisively for V1:

```
                          MediaPipe        OpenPose         MMPose
──────────────────────────────────────────────────────────────────────
GPU required               No              Yes (CUDA)       Yes (CUDA)
Landmarks                  33              25               17-133
Install                    pip install     Build from src   pip + deps
License                    Apache 2.0      Non-commercial   Apache 2.0
Real-time capable          Yes             Yes (w/ GPU)     Yes (w/ GPU)
Cricket-relevant points    Wrists, elbows, Fewer upper      Configurable
                           shoulders,      body points
                           hips, knees,
                           ankles, feet
Accuracy (general)         Good            Better           Best
Accuracy (cricket-usable)  Sufficient      Better           Overkill
```

> [!WARNING]
> MediaPipe's accuracy is lower than OpenPose/MMPose for research-grade analysis. This is acceptable for V1 coaching insights. If PitchMind moves to professional team analytics (V3+), a GPU-accelerated model will be necessary.

#### Gemini API over OpenAI

| Factor                    | Gemini              | OpenAI GPT-4           | Claude                 |
| ------------------------- | ------------------- | ---------------------- | ---------------------- |
| Structured JSON output    | Excellent            | Good                   | Good                   |
| Reasoning quality         | Excellent            | Excellent              | Excellent              |
| Google ecosystem fit      | ✅ (MediaPipe)       | ❌                     | ❌                     |
| Free tier                 | Generous             | Limited                | Limited                |
| Cost at scale             | Competitive          | Higher                 | Higher                 |
| Python SDK quality        | Good                 | Excellent              | Good                   |

#### Python Dataclasses over Pydantic (in AI Engine)

```python
# AI Engine uses stdlib only — no external validation framework
@dataclass
class BattingAnalysisResult:
    elbow_angle: float
    head_stability: float
    stance_score: float
    coaching_insights: list[str]
```

This is deliberate. The AI engine must be importable without any web framework dependencies. Pydantic models live in the backend — conversion happens at the boundary. See [ADR-002: AI Engine Isolation](./002-ai-engine-isolation.md).

---

## Infrastructure Stack (V1)

| Technology         | Chosen                        | Alternatives Considered     | Why Chosen                                                                                         |
| ------------------ | ----------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| File Storage       | **Local filesystem**          | AWS S3, MinIO, GCS          | Zero setup, zero cost, `StorageService` abstraction enables S3 migration without code changes.     |
| Database           | **SQLite file**               | PostgreSQL, PlanetScale     | Zero ops. File-based. Perfect for V1. See Backend section.                                         |
| Task Processing    | **FastAPI BackgroundTasks**   | Celery + Redis, RQ, Dramatiq| No broker dependency (no Redis/RabbitMQ). Sufficient for single-server, single-worker V1.          |
| CI/CD              | **GitHub Actions**            | GitLab CI, CircleCI, Jenkins| Free for public/private repos, excellent ecosystem, YAML-based, no self-hosted runners needed.     |
| Hosting (planned)  | **Vercel (FE) + Railway (BE)**| AWS, GCP, Fly.io, Render   | Vercel is zero-config for Next.js. Railway is simple for FastAPI. Both have generous free tiers.    |

### Infrastructure Decisions — V1 Constraints

```
V1 Architecture (Single Machine):

┌─────────────────────────────────────────────┐
│                 Developer Machine            │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Next.js  │  │ FastAPI  │  │ AI Engine │  │
│  │ :3000    │→ │ :8000    │→ │ (in-proc) │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│                     │                        │
│              ┌──────┴──────┐                 │
│              │   SQLite    │                 │
│              │ pitchmind.db│                 │
│              └─────────────┘                 │
│                     │                        │
│              ┌──────┴──────┐                 │
│              │  storage/   │                 │
│              │  (local fs) │                 │
│              └─────────────┘                 │
└─────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Every infrastructure choice has an abstraction layer. `StorageService` wraps file I/O. `DATABASE_URL` configures the database. `BackgroundTasks` can be replaced with Celery. No V1 shortcut creates a migration wall.

---

## Consequences

### What This Enables

| Benefit                          | How                                                              |
| -------------------------------- | ---------------------------------------------------------------- |
| Zero-to-running in 10 minutes   | No Docker, no database server, no message broker                 |
| AI-first development             | Python ecosystem end-to-end (FastAPI + AI engine)                |
| Type safety across the stack     | TypeScript (FE) + Pydantic (BE) + dataclasses (AI)               |
| Rapid iteration                  | Hot reload on all three layers, no build step for AI engine      |
| Production-ready architecture    | Every abstraction supports migration to production infrastructure|
| Single developer velocity        | Minimal boilerplate, maximal tooling (auto docs, type checking)  |

### What This Constrains

| Constraint                       | Impact                                                           | Mitigation                         |
| -------------------------------- | ---------------------------------------------------------------- | ---------------------------------- |
| SQLite single-writer             | No concurrent write operations                                   | Migrate to Postgres for multi-user |
| CPU-only pose estimation         | Slower than GPU, lower accuracy                                  | MediaPipe is fast enough for V1    |
| In-process task execution        | Long analysis blocks the worker                                  | Celery when needed                 |
| Local file storage               | No CDN, no redundancy                                            | StorageService abstraction         |
| Phone OTP Authentication         | Requires network connectivity for SMS/email                      | Dynamic Twilio and SMTP templates  |

---

## Future Improvements

1. **PostgreSQL migration** — when multi-user support is added (V1.1+)
2. **S3 file storage** — when deploying to cloud (V1.1+)
3. **Celery + Redis** — when analysis queue exceeds single-worker capacity
4. **GPU pose estimation** — when accuracy requirements increase (V3+)
5. **Tailwind CSS** — reconsider if team grows beyond 3 frontend devs

---

## Risks / Limitations

| Risk                                    | Likelihood | Impact | Mitigation                                    |
| --------------------------------------- | ---------- | ------ | --------------------------------------------- |
| MediaPipe accuracy insufficient         | Medium     | High   | Benchmark against manual annotations          |
| SQLite corruption under load            | Low        | High   | WAL mode enabled, migrate to Postgres early   |
| Gemini API rate limiting                | Medium     | Medium | Cache coaching results, implement retry logic |
| Next.js App Router instability          | Low        | Medium | Pin version, monitor changelogs               |
| Vendor lock-in (Vercel)                 | Low        | Low    | Next.js runs on any Node.js host              |

---

## Dependencies

| Layer      | Key Dependencies                                          | Version Strategy   |
| ---------- | --------------------------------------------------------- | ------------------ |
| Frontend   | next, react, zustand, recharts, framer-motion             | Pin major versions |
| Backend    | fastapi, sqlalchemy, alembic, pydantic, uvicorn           | Pin major versions |
| AI Engine  | mediapipe, opencv-python, numpy, google-generativeai      | Pin exact versions |
| Dev Tools  | typescript, eslint, pytest, ruff, mypy                    | Pin major versions |

---

## Related Systems

- [ADR-002: AI Engine Isolation](./002-ai-engine-isolation.md) — why the AI engine has zero web dependencies
- [ADR-003: Data Storage Strategy](./003-data-storage-strategy.md) — file and database storage design
- [Dev Log #001: Architecture Design](../dev-logs/001-architecture-design.md) — design phase documentation
- [V1 Development Roadmap](../roadmap/001-v1-development-roadmap.md) — implementation timeline
