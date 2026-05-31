# ADR-002 — AI Engine Isolation Strategy

| Field    | Value                                              |
| -------- | -------------------------------------------------- |
| Date     | 2025-05-27                                         |
| Author   | PitchMind Engineering                              |
| Status   | **Accepted**                                       |
| Category | Architecture Decision Record                      |

---

## Summary

The PitchMind AI engine (`ai-engine/`) is designed as a **pure Python package** with zero web framework dependencies. It imports nothing from FastAPI, Pydantic, SQLAlchemy, or any HTTP-related library. This is the single most important architectural boundary in the system.

---

## Problem Statement

AI/ML code and web application code have fundamentally different concerns:

| Concern               | Web Application             | AI/ML Pipeline                     |
| --------------------- | --------------------------- | ---------------------------------- |
| Primary goal          | Handle HTTP requests        | Process video, extract insights    |
| Dependencies          | Framework, ORM, validation  | MediaPipe, OpenCV, NumPy           |
| Testing               | Integration tests, API mocks| Unit tests, numerical assertions   |
| Deployment target     | Web server (uvicorn)        | GPU machine, Lambda, CLI, worker   |
| Developer profile     | Full-stack engineer         | ML/AI engineer                     |
| Iteration speed       | Fast (hot reload)           | Slow (model loading, video I/O)    |
| State management      | Database, sessions          | Stateless pipeline                 |

Mixing these concerns creates a monolith where:
- Testing the AI pipeline requires booting a web server
- Deploying the AI engine requires installing FastAPI
- ML engineers must understand HTTP semantics
- Scaling the AI workload means scaling the entire application

---

## Decision

**The `ai-engine` package has ZERO web framework dependencies.** No FastAPI, no Pydantic, no SQLAlchemy, no HTTP awareness. It is a pure Python library that can be imported by any consumer.

### The Interface Contract

The AI engine exposes exactly three public interfaces:

```python
# ai-engine/src/pitchmind_ai/pipeline.py

class BattingPipeline:
    """The single entry point. One class, one method."""

    def __init__(self, config: PipelineConfig):
        ...

    def analyze(self, video_path: str) -> BattingAnalysisResult:
        """Process a video file. Returns structured results."""
        ...
```

```python
# ai-engine/src/pitchmind_ai/models.py

@dataclass
class PipelineConfig:
    """Configuration for pipeline execution."""
    gemini_api_key: str | None = None
    enable_gemini: bool = True
    min_detection_confidence: float = 0.5
    min_tracking_confidence: float = 0.5
    max_frames_to_process: int = 300

@dataclass
class BattingAnalysisResult:
    """Complete analysis output."""
    elbow_angle: ElbowAngleMetrics
    head_stability: HeadStabilityMetrics
    stance: StanceMetrics
    footwork: FootworkMetrics
    overall_score: float
    coaching_insights: list[CoachingInsight]
    frame_count: int
    processing_time_seconds: float
    landmarks_data: list[dict]
```

### Import Rules

```
ai-engine CAN import:
  ├── mediapipe
  ├── opencv-python (cv2)
  ├── numpy
  ├── google-generativeai
  └── Python stdlib (dataclasses, pathlib, logging, json, math, typing)

ai-engine CANNOT import:
  ├── fastapi
  ├── pydantic
  ├── sqlalchemy
  ├── alembic
  ├── uvicorn
  ├── httpx / requests
  └── Any web/HTTP library
```

### Export Rules

```
ai-engine EXPORTS:
  ├── BattingPipeline          # Entry point class
  ├── BattingAnalysisResult    # Result dataclass
  ├── PipelineConfig           # Configuration dataclass
  ├── ElbowAngleMetrics        # Sub-result dataclass
  ├── HeadStabilityMetrics     # Sub-result dataclass
  ├── StanceMetrics            # Sub-result dataclass
  ├── FootworkMetrics          # Sub-result dataclass
  └── CoachingInsight          # Sub-result dataclass
```

---

## Architecture

### Dependency Direction

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEPENDENCY FLOW                          │
│                     (arrows = "depends on")                     │
│                                                                 │
│  ┌──────────────┐       ┌──────────────┐       ┌────────────┐  │
│  │              │       │              │       │            │  │
│  │   Frontend   │──────→│   Backend    │──────→│  AI Engine │  │
│  │  (Next.js)   │ HTTP  │  (FastAPI)   │ Python│  (Pure Py) │  │
│  │              │       │              │ import│            │  │
│  └──────────────┘       └──────────────┘       └────────────┘  │
│                                                                 │
│  Frontend knows about:   Backend knows about:   AI Engine       │
│  - Backend API schema    - AI Engine types       knows about:   │
│  - Nothing else          - Database models       - NOTHING else │
│  │                       - Storage service       - Only its own │
│                          - AI Engine boundary     deps          │
│                                                                 │
│  ════════════════════════════════════════════════════════════    │
│         Dependencies flow RIGHT → LEFT (never reversed)         │
└─────────────────────────────────────────────────────────────────┘
```

### Boundary Layer

The backend touches the AI engine through **exactly one file**: `analysis_worker.py`.

```
backend/
└── src/
    └── pitchmind/
        └── workers/
            └── analysis_worker.py   ← ONLY file that imports ai-engine
```

```python
# backend/src/pitchmind/workers/analysis_worker.py

from pitchmind_ai import BattingPipeline, PipelineConfig, BattingAnalysisResult

async def run_analysis(video_path: str, analysis_id: str):
    """Bridge between web layer and AI layer."""

    # 1. Create pipeline (AI engine — no web concepts)
    config = PipelineConfig(
        gemini_api_key=settings.GEMINI_API_KEY,
    )
    pipeline = BattingPipeline(config)

    # 2. Run analysis (pure Python — no HTTP, no DB)
    result: BattingAnalysisResult = pipeline.analyze(video_path)

    # 3. Convert to web layer (dataclass → Pydantic → database)
    #    This conversion happens HERE, not in the AI engine
    analysis_data = convert_to_db_model(result)
    await save_analysis(analysis_id, analysis_data)
```

> [!IMPORTANT]
> The `convert_to_db_model()` function handles the dataclass → Pydantic/SQLAlchemy conversion. This is the **only place** where AI engine types meet web framework types. The conversion overhead is negligible compared to video processing time.

---

## Rationale

### 1. Testability

The AI engine can be tested with `pytest` alone — no server, no database, no HTTP client:

```python
# ai-engine/tests/test_pipeline.py

def test_elbow_angle_extraction():
    config = PipelineConfig(enable_gemini=False)
    pipeline = BattingPipeline(config)
    result = pipeline.analyze("tests/fixtures/batting_clip.mp4")

    assert 0 <= result.elbow_angle.backswing_angle <= 180
    assert result.frame_count > 0
```

No `TestClient`, no `AsyncClient`, no database fixtures, no server startup. Just Python.

### 2. Portability

The same `BattingPipeline` can be consumed by any wrapper:

```
┌─────────────────────────────────────────────────┐
│            BattingPipeline Consumers             │
│                                                  │
│  ┌──────────────┐  Current (V1)                  │
│  │ FastAPI      │  BackgroundTasks worker         │
│  │ Worker       │  In-process execution           │
│  └──────────────┘                                │
│                                                  │
│  ┌──────────────┐  Future (V2)                   │
│  │ Celery       │  Distributed task queue         │
│  │ Worker       │  Redis broker                   │
│  └──────────────┘                                │
│                                                  │
│  ┌──────────────┐  Future (V2+)                  │
│  │ AWS Lambda   │  Serverless per-video           │
│  │ / GCP Cloud  │  Auto-scaling                   │
│  │ Functions    │                                 │
│  └──────────────┘                                │
│                                                  │
│  ┌──────────────┐  Future (V3)                   │
│  │ gRPC Service │  Dedicated GPU microservice     │
│  │              │  Multi-language clients          │
│  └──────────────┘                                │
│                                                  │
│  ┌──────────────┐  Always available               │
│  │ CLI Tool     │  python -m pitchmind_ai analyze │
│  │              │  batch_video.mp4                │
│  └──────────────┘                                │
└─────────────────────────────────────────────────┘
```

None of these consumers require changes to the AI engine.

### 3. Team Independence

| Role                | Works on          | Needs to understand        |
| ------------------- | ----------------- | -------------------------- |
| ML Engineer         | `ai-engine/`      | MediaPipe, OpenCV, NumPy   |
| Backend Engineer    | `backend/`        | FastAPI, SQLAlchemy         |
| Frontend Engineer   | `frontend/`       | Next.js, React, TypeScript |
| DevOps Engineer     | CI/CD, infra      | Docker, deployment         |

An ML engineer can clone only `ai-engine/`, run `pip install -e .`, and develop without ever installing FastAPI.

### 4. Deployment Flexibility

```
V1 (Current):
  Single machine → AI engine runs in FastAPI process

V2 (Scale):
  Web server (Machine A) → Celery → AI worker (Machine B, GPU)

V3 (Production):
  Web server (K8s) → gRPC → AI service (GPU cluster)
```

Each transition requires zero changes to the AI engine code.

### 5. Clean Interface

The AI engine's API surface is deliberately minimal:

```
Total public surface area:
  - 1 class   (BattingPipeline)
  - 1 method  (analyze)
  - 1 config  (PipelineConfig)
  - 1 result  (BattingAnalysisResult)
  - 5 sub-results (ElbowAngleMetrics, HeadStabilityMetrics, etc.)
```

> [!NOTE]
> Compare this to a typical Django app's ML integration: model imports scattered across views, serializers, management commands, and Celery tasks. The surface area is 10-50x larger and impossible to reason about.

---

## Boundary Rules

### What Crosses the Boundary

```
INTO the AI Engine:
  ├── video_path: str          (filesystem path to video file)
  └── config: PipelineConfig   (dataclass with settings)

OUT of the AI Engine:
  └── result: BattingAnalysisResult   (dataclass tree)
```

### What Does NOT Cross the Boundary

```
NEVER enters the AI Engine:
  ├── HTTP request objects
  ├── Database sessions
  ├── SQLAlchemy models
  ├── Pydantic models
  ├── File upload objects (UploadFile)
  ├── Analysis IDs (database concept)
  ├── User IDs (auth concept)
  └── Status updates (WebSocket concept)
```

### The Installation Boundary

```toml
# ai-engine/pyproject.toml
[project]
dependencies = [
    "mediapipe>=0.10.0",
    "opencv-python>=4.8.0",
    "numpy>=1.24.0",
    "google-generativeai>=0.5.0",
]

# NOTE: No fastapi, no pydantic, no sqlalchemy, no uvicorn
```

```toml
# backend/pyproject.toml
[project]
dependencies = [
    "fastapi>=0.110.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "pydantic>=2.0.0",
    "pitchmind-ai @ file:///../ai-engine",  # ← local editable install
]
```

---

## Consequences

### Positive

| Benefit                       | Details                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| **Testable in isolation**     | `pytest ai-engine/` works without any server running            |
| **Portable to any consumer**  | FastAPI today, Celery tomorrow, Lambda next year                |
| **Team-independent**          | ML engineers never touch FastAPI, backend devs never touch OpenCV|
| **Deployable separately**     | Can run AI engine on GPU machine, web server on CPU machine     |
| **Debuggable**                | Pipeline issues are always in `ai-engine/`, never in web code   |
| **Replaceable**               | Swap MediaPipe for MMPose without touching the backend          |

### Negative

| Cost                                     | Impact   | Mitigation                                    |
| ---------------------------------------- | -------- | --------------------------------------------- |
| Data conversion at boundary              | Low      | One-time conversion, negligible vs. video I/O |
| Cannot share Pydantic models             | Low      | Explicit conversion is clearer than sharing    |
| Duplicate type definitions               | Low      | Backend Pydantic mirrors AI dataclasses        |
| No real-time progress from AI engine     | Medium   | Add callback parameter to `analyze()` if needed|
| Cannot use FastAPI's dependency injection | Low      | AI engine doesn't need DI                      |

> [!WARNING]
> The data conversion overhead (`dataclass` → `Pydantic` → `SQLAlchemy model`) is real but trivial. A video analysis takes 5-30 seconds. The conversion takes <1ms. This is not a performance concern.

---

## Future Improvements

1. **Progress callbacks** — add optional `on_progress: Callable` parameter to `analyze()` for real-time status updates without breaking isolation
2. **Async interface** — add `async def analyze_async()` for non-blocking execution in async contexts
3. **Plugin architecture** — allow registering custom analyzers (bowling, fielding) without modifying core pipeline
4. **Binary distribution** — publish `pitchmind-ai` to private PyPI for clean dependency management

---

## Risks / Limitations

| Risk                                        | Likelihood | Impact | Mitigation                                  |
| ------------------------------------------- | ---------- | ------ | ------------------------------------------- |
| Boundary too rigid for rapid prototyping     | Low        | Low    | Boundary is 1 file — easy to cross if needed|
| Dataclass ↔ Pydantic drift                  | Medium     | Medium | Integration tests verify conversion          |
| AI engine grows too large for single package | Low        | Medium | Split into sub-packages when needed          |

---

## Dependencies

| Component           | Dependencies                                        |
| ------------------- | --------------------------------------------------- |
| AI Engine           | mediapipe, opencv-python, numpy, google-generativeai |
| Boundary Layer      | analysis_worker.py (single file in backend)         |
| Backend → AI Engine | `pip install -e ../ai-engine` (editable install)    |

---

## Related Systems

- [ADR-001: Technology Stack Selection](./001-tech-stack-selection.md) — why these specific technologies
- [ADR-003: Data Storage Strategy](./003-data-storage-strategy.md) — how analysis results are persisted
- [Dev Log #001: Architecture Design](../dev-logs/001-architecture-design.md) — design phase documentation
