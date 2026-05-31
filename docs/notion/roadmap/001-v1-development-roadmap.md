# PitchMind V1 — Development Roadmap

| Field    | Value                                              |
| -------- | -------------------------------------------------- |
| Date     | 2025-05-27                                         |
| Author   | PitchMind Engineering                              |
| Status   | **Active**                                         |
| Category | Roadmap                                            |

---

## Summary

This document defines the complete V1 development plan for PitchMind — from an empty repository to a working cricket batting analysis platform. Development is organized into five phases over ~7 weeks, prioritizing the AI pipeline first and building the web application around validated AI capabilities.

---

## Problem Statement

PitchMind V1 must deliver a complete vertical: **upload a batting video → get coaching insights**. The roadmap must sequence work to:

1. **Validate the AI core first** — if pose estimation doesn't work for cricket, nothing else matters
2. **Ship incrementally** — each phase produces a testable, demonstrable artifact
3. **Avoid premature optimization** — build what's needed, not what might be needed
4. **Enable rapid iteration** — architecture supports changing metrics without rewrites

---

## V1 Scope Definition

### What V1 Does

```
┌─────────────────────────────────────────────────────────────┐
│                    V1 USER JOURNEY                          │
│                                                             │
│  1. Upload    → Drag & drop batting video (.mp4)            │
│  2. Process   → Automatic frame extraction + pose analysis  │
│  3. Analyze   → Biomechanical metrics calculated            │
│  4. Coach     → AI-generated coaching insights              │
│  5. Visualize → Interactive dashboard with charts           │
└─────────────────────────────────────────────────────────────┘
```

### Metrics Calculated

| Metric Category  | Specific Measurements                                | Score Range |
| ---------------- | ---------------------------------------------------- | ----------- |
| **Elbow Angle**  | Backswing angle, impact angle, follow-through angle, max extension, consistency | 0–100 |
| **Head Stability**| Lateral movement, vertical movement, movement trajectory | 0–100 |
| **Stance**       | Width ratio, weight distribution, knee bend angle    | 0–100       |
| **Footwork**     | Front foot stride, back foot pivot, transfer timing  | 0–100       |
| **Overall**      | Weighted composite of all metrics                    | 0–100       |

### Coaching Insights

| Source         | Type                                                  |
| -------------- | ----------------------------------------------------- |
| Rule-based     | Threshold-based feedback (e.g., "elbow angle < 150° at impact = warning") |
| Gemini AI      | Contextual analysis combining all metrics into natural language coaching  |

---

## Phase 1: AI Foundation (Week 1–2)

**Goal:** Validate that MediaPipe can extract useful pose data from cricket batting videos.

### Deliverables

| #  | Task                                  | Description                                                | Tests Required           |
| -- | ------------------------------------- | ---------------------------------------------------------- | ------------------------ |
| 1  | Project scaffolding                   | Create monorepo structure, all directories, configs         | Structure verified       |
| 2  | AI engine package setup               | `pyproject.toml`, `__init__.py`, editable install           | `import pitchmind_ai`    |
| 3  | Frame extraction module               | OpenCV-based video → frames extraction                      | Extract from test video  |
| 4  | Pose estimation module                | MediaPipe Pose integration, landmark extraction             | Landmarks from test frame|
| 5  | Elbow angle calculation               | Basic angle math from shoulder → elbow → wrist landmarks    | Known-angle test cases   |
| 6  | Pipeline orchestrator (v1)            | `BattingPipeline.analyze()` basic flow                      | End-to-end test          |
| 7  | Unit test suite                       | Tests for all modules above                                 | All green                |

### Key Technical Work

```python
# Frame extraction (Phase 1 deliverable)
class FrameExtractor:
    def extract(self, video_path: str, max_frames: int = 300) -> list[Frame]:
        cap = cv2.VideoCapture(video_path)
        frames = []
        while cap.isOpened() and len(frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(Frame(index=len(frames), data=frame))
        cap.release()
        return frames
```

```python
# Pose estimation (Phase 1 deliverable)
class PoseEstimator:
    def estimate(self, frame: np.ndarray) -> PoseLandmarks | None:
        with mp.solutions.pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ) as pose:
            results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if results.pose_landmarks:
                return self._convert_landmarks(results.pose_landmarks)
        return None
```

```python
# Elbow angle (Phase 1 deliverable)
def calculate_elbow_angle(shoulder: Point3D, elbow: Point3D, wrist: Point3D) -> float:
    """Calculate angle at elbow joint using 3D coordinates."""
    vec_upper = np.array([shoulder.x - elbow.x, shoulder.y - elbow.y, shoulder.z - elbow.z])
    vec_lower = np.array([wrist.x - elbow.x, wrist.y - elbow.y, wrist.z - elbow.z])
    cosine = np.dot(vec_upper, vec_lower) / (np.linalg.norm(vec_upper) * np.linalg.norm(vec_lower))
    return np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))
```

### Phase 1 Exit Criteria

- [ ] `BattingPipeline.analyze("test_video.mp4")` returns a result with valid elbow angles
- [ ] Unit tests pass with >90% coverage on AI engine
- [ ] Processing time <30 seconds for a 10-second video
- [ ] Landmark extraction works on at least 80% of frames in test video

> [!IMPORTANT]
> Phase 1 is the riskiest phase. If MediaPipe can't extract useful landmarks from cricket batting videos, we need to pivot to a different pose estimation approach before building anything else.

---

## Phase 2: Backend Foundation (Week 2–3)

**Goal:** Build the web API that wraps the AI pipeline and provides upload/analysis capabilities.

### Deliverables

| #  | Task                                  | Description                                                | Tests Required            |
| -- | ------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| 1  | FastAPI project setup                 | App factory, config, CORS, error handling                   | App starts, health check  |
| 2  | Database setup                        | SQLAlchemy models, Alembic migrations, SQLite config        | Migration runs            |
| 3  | Storage service                       | `LocalStorageService` implementation                        | Save/retrieve files       |
| 4  | Upload API endpoint                   | `POST /api/v1/videos/upload` with file validation           | Upload test video         |
| 5  | Video listing API                     | `GET /api/v1/videos` with pagination                        | List uploaded videos      |
| 6  | Background worker                     | `analysis_worker.py` — bridge to AI pipeline                | Trigger analysis          |
| 7  | Analysis results API                  | `GET /api/v1/analyses/{id}` with full results               | Retrieve analysis         |
| 8  | WebSocket status updates              | `WS /api/v1/ws/analysis/{id}` for real-time status          | Status transitions        |
| 9  | API test suite                        | Integration tests with TestClient                           | All endpoints tested      |

### API Specification

```
POST   /api/v1/videos/upload          Upload a video file
GET    /api/v1/videos                  List all videos (paginated)
GET    /api/v1/videos/{id}             Get video details + status
DELETE /api/v1/videos/{id}             Delete video and all assets
GET    /api/v1/analyses/{id}           Get full analysis results
GET    /api/v1/analyses/{id}/frames    Get extracted frame URLs
WS     /api/v1/ws/analysis/{id}        Real-time analysis status
GET    /api/v1/health                  Health check
```

### Phase 2 Exit Criteria

- [ ] Upload a video via API → triggers analysis → returns results via GET
- [ ] WebSocket sends status updates: pending → running → completed
- [ ] API docs accessible at `http://localhost:8000/docs`
- [ ] All endpoints return proper error responses (400, 404, 500)

---

## Phase 3: Full AI Pipeline (Week 3–4)

**Goal:** Complete all biomechanical metrics and coaching insight generation.

### Deliverables

| #  | Task                                  | Description                                                | Tests Required            |
| -- | ------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| 1  | Head stability metrics                | Track nose/eye landmarks across frames, calculate movement  | Movement within expected range |
| 2  | Stance analysis                       | Hip-to-ankle width ratio, weight distribution, knee bend    | Correct stance metrics    |
| 3  | Footwork metrics                      | Front foot stride, back foot pivot, timing analysis         | Correct footwork scores   |
| 4  | Scoring system                        | Weighted composite score (0-100) across all metrics         | Scores in valid range     |
| 5  | Rule-based coaching engine            | Threshold-based insights per metric category                | Generate relevant insights|
| 6  | Gemini coaching integration           | Send metrics to Gemini, parse structured coaching response  | Gemini returns insights   |
| 7  | Pipeline v2 (complete)                | Full `BattingPipeline` with all metrics and coaching        | End-to-end test           |
| 8  | Error handling                        | Graceful handling of bad videos, missing landmarks, API failures | Error cases tested    |

### Scoring System Design

```
Overall Score = weighted average of:
  ├── Elbow Angle Score      (weight: 0.30)  — technique
  ├── Head Stability Score   (weight: 0.25)  — balance
  ├── Stance Score           (weight: 0.25)  — foundation
  └── Footwork Score         (weight: 0.20)  — movement

Each sub-score: 0-100 based on deviation from ideal values.
```

| Metric               | Ideal Value          | Score 100                   | Score 0                        |
| --------------------- | -------------------- | --------------------------- | ------------------------------ |
| Elbow at impact       | 170°–180°            | Within 5° of ideal          | >30° deviation                 |
| Head lateral movement | <2cm                 | <1cm                        | >8cm                           |
| Stance width ratio    | 1.0–1.3× shoulder   | Within ideal range          | <0.6× or >1.8× shoulder       |
| Front foot stride     | 60–80cm (age-adjusted)| Within ideal range         | <30cm or >120cm                |

### Coaching Rule Examples

```python
COACHING_RULES = [
    {
        "condition": lambda m: m.elbow_angle.impact_angle < 150,
        "severity": "critical",
        "category": "elbow_angle",
        "title": "Bent Arm at Impact",
        "message": "Your elbow angle is {angle}° at impact. Aim for 170-180° for maximum power.",
    },
    {
        "condition": lambda m: m.head_stability.lateral_movement_cm > 5,
        "severity": "warning",
        "category": "head_stability",
        "title": "Excessive Head Movement",
        "message": "Your head moves {movement}cm laterally. Keep your head still for better balance.",
    },
]
```

### Phase 3 Exit Criteria

- [ ] All four metric categories return valid scores
- [ ] Rule-based coaching generates at least 2 insights per analysis
- [ ] Gemini coaching returns structured, actionable feedback
- [ ] Overall score correlates with manual assessment (spot-check)
- [ ] Pipeline handles edge cases: short videos, no person detected, API failures

---

## Phase 4: Frontend (Week 4–6)

**Goal:** Build the complete user-facing application with upload, dashboard, and analysis views.

### Deliverables

| #  | Task                                  | Description                                                | Tests/Criteria            |
| -- | ------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| 1  | Next.js project setup                 | App Router, layout, global styles, design tokens            | App renders at :3000      |
| 2  | Design system                         | CSS custom properties, typography, colors, spacing, components | Consistent theming      |
| 3  | Layout shell                          | Navigation, sidebar, responsive layout                      | Desktop + mobile layouts  |
| 4  | Upload page                           | Drag & drop zone, file validation, upload progress bar      | File upload works         |
| 5  | Dashboard page                        | Video list, analysis status cards, sort/filter              | Lists all videos          |
| 6  | Analysis view — Overview              | Overall score (radial gauge), metric summary cards          | Scores render correctly   |
| 7  | Analysis view — Metrics               | Detailed metric charts (Recharts), comparison bars          | Charts render with data   |
| 8  | Analysis view — Coaching              | Coaching insights cards, severity indicators, recommendations| Insights display properly |
| 9  | Pose overlay visualization            | Skeleton overlay on extracted frames, frame scrubber        | Landmarks visible on frame|
| 10 | Loading & error states                | Skeleton loaders, error boundaries, empty states            | All states handled        |
| 11 | Animations                            | Page transitions, card reveals, progress animations         | Smooth, 60fps             |
| 12 | Responsive design                     | Mobile, tablet, desktop breakpoints                         | All viewports work        |

### Page Architecture

```
/                        → Landing page (product info, CTA)
/upload                  → Upload page (drag-drop, progress)
/dashboard               → Dashboard (video list, status)
/analysis/[id]           → Analysis view (metrics, coaching, pose)
  ├── /analysis/[id]              → Overview tab
  ├── /analysis/[id]/metrics      → Detailed metrics tab
  ├── /analysis/[id]/coaching     → Coaching insights tab
  └── /analysis/[id]/pose         → Pose visualization tab
```

### Design System Tokens

```css
:root {
  /* Colors — Dark theme (cricket pitch-inspired) */
  --color-bg-primary: #0a0e17;
  --color-bg-secondary: #111827;
  --color-bg-card: #1a2332;
  --color-accent-primary: #3b82f6;      /* Blue — primary actions */
  --color-accent-success: #22c55e;      /* Green — good scores */
  --color-accent-warning: #f59e0b;      /* Amber — needs improvement */
  --color-accent-danger: #ef4444;       /* Red — critical issues */
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;

  /* Typography */
  --font-family: 'Inter', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;

  /* Spacing (8px base grid) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Borders & Radii */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --border-subtle: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Zustand Store Architecture

```
stores/
├── useUploadStore.ts       # Upload state: file, progress, status
├── useAnalysisStore.ts     # Analysis data: metrics, coaching, landmarks
├── useVideoStore.ts        # Video list: items, pagination, filters
└── useUIStore.ts           # UI state: sidebar, theme, modals
```

### Phase 4 Exit Criteria

- [ ] User can upload a video from the browser
- [ ] Dashboard shows all videos with real-time status updates
- [ ] Analysis view renders all four metric categories with charts
- [ ] Coaching insights display with severity color coding
- [ ] Pose overlay shows skeleton on extracted frames
- [ ] All pages are responsive (mobile, tablet, desktop)
- [ ] Animations are smooth (no jank, 60fps)

---

## Phase 5: Integration & Polish (Week 6–7)

**Goal:** End-to-end testing, error hardening, performance optimization, and documentation.

### Deliverables

| #  | Task                                  | Description                                                | Criteria                  |
| -- | ------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| 1  | End-to-end testing                    | Full user flow: upload → process → view results             | E2E test passes           |
| 2  | Error handling hardening              | All error paths tested: bad files, network errors, API failures | Graceful degradation   |
| 3  | Performance optimization              | Frontend: lazy loading, memoization. Backend: query optimization | <3s page load         |
| 4  | API documentation                     | OpenAPI spec complete, all endpoints documented              | Swagger UI complete       |
| 5  | README files                          | Root, frontend, backend, ai-engine READMEs                   | New dev can set up in 10min|
| 6  | Architecture documentation            | Update all ADRs and dev logs with implementation learnings    | Docs match reality        |
| 7  | Code cleanup                          | Remove dead code, consistent formatting, TODO resolution     | Clean codebase            |
| 8  | Demo preparation                      | Record demo video, prepare sample batting videos             | Demo-ready                |

### Performance Targets

| Metric                                  | Target         | How to Measure               |
| --------------------------------------- | -------------- | ---------------------------- |
| Video upload (50MB file)                | <10 seconds    | Network tab                  |
| Analysis processing (10s video)         | <30 seconds    | Backend logs                 |
| Dashboard page load                     | <2 seconds     | Lighthouse                   |
| Analysis page load                      | <3 seconds     | Lighthouse                   |
| Chart rendering                         | <500ms         | React Profiler               |
| WebSocket status update latency         | <100ms         | Network tab                  |

### Phase 5 Exit Criteria

- [ ] Upload → analysis → dashboard → results works end-to-end without errors
- [ ] All error states display user-friendly messages
- [ ] Lighthouse performance score >80 on all pages
- [ ] A new developer can set up the project in <10 minutes following the README
- [ ] Demo video recorded and working

---

## What NOT to Build in V1

| Feature                    | Reason for Exclusion                                         | When to Add         |
| -------------------------- | ------------------------------------------------------------ | ------------------- |
| Authentication             | Single-user product, adds complexity with no V1 value        | V1.1                |
| Multi-tenant support       | No users to separate, premature infrastructure               | V2                  |
| Microservices              | Single developer, single machine, unnecessary complexity     | V3+                 |
| Kubernetes                 | Zero ops for V1, massive operational overhead                | V3+ (if ever)       |
| Real-time streaming        | V1 is upload-and-process, not live analysis                  | V2                  |
| Mobile application         | Web-first, responsive design covers mobile use cases         | V2                  |
| PDF report export          | Nice-to-have, not core product value                         | V1.2                |
| Payment processing         | No monetization in V1, focus on product-market fit           | V2                  |
| Admin panel                | No users to manage, no content to moderate                   | V2                  |
| Custom ML model training   | MediaPipe is sufficient for V1, custom models are 10x effort | V3+                 |
| Bowling analysis           | V1 is batting only, bowling has different biomechanics       | V2                  |
| Fielding analysis          | Different domain, different metrics, different UI            | V2+                 |
| Team analytics             | Requires multi-user, aggregation, completely different product| V3                  |
| Video comparison           | Requires rethinking data model and UI                        | V1.2                |
| Social sharing             | Not core product value, distraction                          | V2                  |

> [!WARNING]
> Every feature on this list was tempting to include. Each one would add 1-4 weeks of development time. V1 must ship in 7 weeks. Discipline here is survival.

---

## Timeline Summary

```
Week 1  ████████████████████░░░░░░░░░░░░░░░░░░░░░░  Phase 1: AI Foundation
Week 2  ██████████████████████████████░░░░░░░░░░░░░  Phase 1 → Phase 2
Week 3  ░░░░░░░░░░░░░░████████████████████░░░░░░░░░  Phase 2 → Phase 3
Week 4  ░░░░░░░░░░░░░░░░░░░░████████████████████░░░  Phase 3 → Phase 4
Week 5  ░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████  Phase 4: Frontend
Week 6  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████  Phase 4 → Phase 5
Week 7  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████  Phase 5: Polish

        ─── Phase 1 ──── Phase 2 ──── Phase 3 ──── Phase 4 ──── Phase 5 ───
        AI Foundation    Backend      Full AI      Frontend    Integration
```

---

## Risk Register

| Risk                                        | Likelihood | Impact | Mitigation                                       | Owner   |
| ------------------------------------------- | ---------- | ------ | ------------------------------------------------ | ------- |
| MediaPipe accuracy insufficient for cricket | Medium     | Critical| Test with real batting videos in Week 1            | AI Lead |
| Gemini API downtime during demo             | Low        | High   | Cache coaching results, rule-based fallback        | Backend |
| Frontend takes longer than 2 weeks          | Medium     | Medium | Cut pose visualization, focus on core dashboard    | Frontend|
| Scope creep (bowling, auth, etc.)           | High       | High   | Strict scope freeze, defer to V2 backlog           | PM      |
| Solo developer burnout                      | Medium     | High   | Ship small wins, celebrate phases, take breaks     | Self    |
| SQLite performance bottleneck               | Low        | Low    | WAL mode, and <100 records in V1                   | Backend |

---

## Future Vision: V2+

> [!NOTE]
> These are aspirational features, not commitments. V2 scope will be determined by user feedback on V1.

### V2 (3-6 months post-V1)

| Feature                      | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| Bowling analysis             | Run-up, release point, seam position, line & length    |
| User authentication          | Sign up, login, personal dashboard                     |
| Video comparison             | Compare two batting videos side-by-side                |
| Progress tracking            | Track metric improvements over time                    |
| PDF/image export             | Export analysis as shareable report                     |
| PostgreSQL migration         | Multi-user database with concurrent write support      |
| S3 file storage              | Cloud storage with CDN for frames and videos           |

### V3 (6-12 months post-V1)

| Feature                      | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| Fielding analysis            | Catching technique, throwing accuracy                  |
| Wicketkeeping analysis       | Glovework, footwork, positioning                       |
| Team analytics dashboard     | Aggregate metrics across team members                  |
| Injury risk prediction       | Identify biomechanical patterns linked to injury       |
| AI-powered drill suggestions | Personalized practice plans based on weaknesses        |
| Custom ML models             | Fine-tuned pose estimation for cricket-specific poses  |
| Real-time analysis           | Live video feed analysis during practice sessions      |
| Mobile application           | Native iOS/Android apps for on-field use               |

### V4+ (12+ months)

| Feature                      | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| Match analysis               | Full-match video breakdown, innings analysis           |
| Opposition scouting          | Analyze opponent batting/bowling weaknesses            |
| Wearable integration         | IMU sensor data combined with video analysis           |
| AR coaching overlay          | Real-time pose correction via AR glasses               |
| API marketplace              | Third-party developers build on PitchMind data         |

---

## Dependencies

| Phase   | Depends On                        | External Dependencies                    |
| ------- | --------------------------------- | ---------------------------------------- |
| Phase 1 | —                                 | Python 3.11+, MediaPipe, OpenCV          |
| Phase 2 | Phase 1 (AI pipeline works)       | FastAPI, SQLAlchemy, SQLite              |
| Phase 3 | Phase 1 (basic pipeline)          | Gemini API key, test batting videos      |
| Phase 4 | Phase 2 (API endpoints exist)     | Node.js 20+, Next.js 15                 |
| Phase 5 | All phases                        | —                                        |

---

## Related Systems

- [ADR-001: Technology Stack Selection](../decisions/001-tech-stack-selection.md) — technology choices for each phase
- [ADR-002: AI Engine Isolation](../decisions/002-ai-engine-isolation.md) — why AI pipeline is built first
- [ADR-003: Data Storage Strategy](../decisions/003-data-storage-strategy.md) — storage design for all phases
- [Dev Log #001: Architecture Design](../dev-logs/001-architecture-design.md) — pre-implementation design decisions
