# Dev Log #003 — AI Pipeline Scaffolding

| Metadata | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Author** | Principal AI/CV Engineer |
| **Status** | Completed |
| **Category** | Dev Logs |

---

## 1. Summary
We have successfully completed **Phase 2: Python AI Pipeline Scaffolding** for PitchMind V1. All core computational modules, mathematical vector angle engines, MediaPipe wrappers, and OpenCV frame extraction pipelines are implemented, bound, and validated through our `pytest` suite.

---

## 2. Technical Execution Overview
Phase 2 establishes the high-fidelity biomechanical heart of PitchMind. We scaffolded the entire computational journey from a raw cricket batting MP4 video file to a structured, type-safe Python data result object:

```
┌────────────────────────────────────────────────────────┐
│                      VIDEO PATH                        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│     1. FrameExtractor (smart downsampling / OpenCV)     │
└──────────────────────────┬─────────────────────────────┘
                           │  list[ExtractedFrame]
                           ▼
┌────────────────────────────────────────────────────────┐
│      2. PoseEstimator (33 joints tracking / MediaPipe)   │
└──────────────────────────┬─────────────────────────────┘
                           │  list[FrameLandmarks]
                           ▼
┌────────────────────────────────────────────────────────┐
│     3. BiomechanicsCalculator (elbow/head calculations)  │
└──────────────────────────┬─────────────────────────────┘
                           │  BattingMetrics
                           ▼
┌────────────────────────────────────────────────────────┐
│       4. CoachingEngine (rule anomaly synthesizers)     │
└──────────────────────────┬─────────────────────────────┘
                           │  list[CoachingInsight]
                           ▼
┌────────────────────────────────────────────────────────┐
│        BATTING ANALYSIS RESULT PAYLOAD (Dataclass)     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Scaffolding Modules Directory Log

| Component File Path | Operations | Purpose & Implementation |
|---|---|---|
| **`models/frame.py`** | **CREATE** | Telemetry and image buffer data models (`ExtractedFrame`). |
| **`models/landmarks.py`** | **CREATE** | Holds 3D coordinates (`Landmark`, `FrameLandmarks`). |
| **`models/metrics.py`** | **CREATE** | Structure for category scores (`ElbowMetrics`, `HeadMetrics`, `StanceMetrics`, `FootworkMetrics`, `BattingMetrics`). |
| **`models/results.py`** | **CREATE** | Unified output payload (`BattingAnalysisResult`, `CoachingInsight`). |
| **`utils/constants.py`** | **CREATE** | Locks standard joint indices and optimal angle thresholds (155°-180°). |
| **`utils/geometry.py`** | **CREATE** | Performs vector dot products to calculate 3D angles in degrees. |
| **`extractors/frame_extractor.py`** | **CREATE** | smart downsampling frame reader using OpenCV. |
| **`pose/estimator.py`** | **CREATE** | MediaPipe Pose integration with visibility thresholds. |
| **`biomechanics/elbow.py`** | **CREATE** | Tracks front elbow collapse flaws (dropped elbow trigger < 140°). |
| **`biomechanics/calculator.py`** | **CREATE** | Main coordinator for biomechanics calculations. |
| **`coaching/engine.py`** | **CREATE** | Synthesizes faults into natural language drill instructions. |
| **`pipeline/batting_pipeline.py`** | **CREATE** | Pipeline orchestrator with granular progress callbacks. |
| **`tests/test_geometry.py`** | **CREATE** | Pytest validating Euclidean distance and straight/right angles. |
| **`tests/test_elbow.py`** | **CREATE** | Pytest validating dropped elbow posture triggers. |

---

## 4. Architectural Principles Preserved
1. **Absolute Framework Isolation:** The `ai-engine` does **not** import any web libraries (no FastAPI, no SQLAlchemy, no Pydantic). It operates completely as a pure, high-performance mathematical CV library.
2. **Deterministic Mechanics:** V1 biomechanics are built on stable vector mathematics (`NumPy`), giving coaches and players highly predictable, explainable metrics rather than black-box AI approximations.
3. **Editable Monorepo Bounds:** Installs as an editable package (`pip install -e pitchmind/ai-engine`), allowing instant server hot-reloading during ML refinements.

---

## 5. Verification Results
Running the unit test suite:
```bash
& "pitchmind/backend/.venv/Scripts/pytest.exe" pitchmind/ai-engine/tests/
```
**Output:**
- `test_geometry.py` — Passed 4/4 (Right-angle, Straight-line, 3D Distance, Midpoint calculations verified).
- `test_elbow.py` — Passed 2/2 (Auto dropped elbow flag at < 140° and ideal extension stability metrics verified).
- **Result:** `6 passed in 0.08s`!

---

## 6. Future Expansion Roadmap
- **Timeline Tracking:** Integrate temporal interpolation to track dynamic motion acceleration.
- **Deep Learning Upgrades:** Transition `PoseEstimator` to a custom fine-tuned model once enough batting footages are collected.
