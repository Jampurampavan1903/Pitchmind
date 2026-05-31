# PitchMind — AI & Computer Vision Engine Architecture

| Metadata | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Author** | Principal AI/CV Engineer |
| **Status** | Approved |
| **Category** | AI Engine |

---

## 1. Summary

The `ai-engine` is a self-contained, pure Python library designed to handle computer vision frame extraction, 2D/3D human pose tracking, biomechanical coordinate mathematics, and natural language coaching evaluations. It is built to operate with **zero web dependencies**, serving as a purely computational package. It takes a raw video file as an input and returns a structured, type-safe Python data structure.

---

## 2. Technical Decisions & Rationale

- **MediaPipe Pose:** We choose Google's MediaPipe Pose over heavier libraries like MMPose or OpenPose. MediaPipe runs extremely quickly on standard CPU resources (making host costs affordable), tracks 33 standard joint landmarks with high sub-pixel confidence, and offers a robust, pre-trained skeleton model out of the box.
- **OpenCV & NumPy:** Standard industry-grade toolkits. OpenCV handles high-performance video decoding and image writing, while NumPy handles efficient multi-dimensional array calculations for joint trigonometry.
- **Rule Engine + Gemini API:** We construct a hybrid coaching layer. Traditional rule-based triggers provide stable, deterministic warnings for basic posture faults (e.g. elbow dropping too low), while the Gemini API serves as our advanced cognitive layer, synthesizing these raw deviations into premium, context-aware coaching advice.
- **Pure Python Dataclasses:** The AI Engine contains no database connections or Pydantic validation schemas. Keeping the core schemas strictly as Python `dataclasses` ensures the engine remains fast, lightweight, and completely untangled from our database or API web frameworks.

---

## 3. Directory Layout

```
ai-engine/pitchmind_ai/
│
├── __init__.py                           # Exposes public pipeline interface
│
├── pipeline/                             # High-Level Orchestrator
│   ├── base.py                           # Abstract Pipeline contract
│   └── batting_pipeline.py               # Coordinates the execution stages
│
├── extractors/                           # Media Pre-processing
│   └── frame_extractor.py                # OpenCV video frame decoding
│
├── pose/                                 # Coordinate Tracking
│   ├── estimator.py                      # MediaPipe landmarks extraction
│   └── landmark_tracker.py               # Temporal smoothing & interpolation
│
├── biomechanics/                         # Biomechanical Analytics
│   ├── calculator.py                     # Orchestrator for calculations
│   ├── elbow.py                          # Batting elbow angles
│   ├── head.py                           # Eye-line & head stability
│   ├── stance.py                         # Feet width and balance
│   └── footwork.py                       # Stride length and timing
│
├── coaching/                             # Intelligent Insights
│   ├── engine.py                         # Unifies rule and LLM recommendations
│   ├── rules.py                          # Classical batting threshold rules
│   ├── llm_coach.py                      # Gemini natural language integration
│   └── prompts.py                        # Context prompts for Gemini
│
└── models/                               # Structured Data Models (pure Python)
    ├── frame.py, landmarks.py, metrics.py, results.py
```

---

## 4. The Computational Pipeline

The public entry point is clean and robust:

```python
class BattingPipeline:
    def analyze(
        self, 
        video_path: str, 
        config: PipelineConfig,
        progress_callback: Callable[[float, str], None] = None
    ) -> BattingAnalysisResult:
        """
        Coordinates the entire execution:
        1. Decodes and samples frames using FrameExtractor.
        2. Estimates 33 coordinate skeletons using PoseEstimator.
        3. Smoothes and interpolates landmarks using LandmarkTracker.
        4. Calculates joint angles using BiomechanicsCalculator.
        5. Evaluates posture anomalies and triggers LLM advice using CoachingEngine.
        """
```

---

## 5. Biomechanical Analytics Detail

The biomechanical engine evaluates four primary dimensions of batting technique:

### A. The Front Elbow Angle (`elbow.py`)
Tracks the lead arm joint angle (shoulder → elbow → wrist) at critical phases. 
- **Cricket coaching theory:** The front elbow should remain high and open (between 160° and 180°) during a vertical drive to control the bat's path. A bent arm (under 140°) signifies a drop in elbow height, reducing power and control.
- **Trigonometric Calculation:** Calculated using the dot product of the upper arm and forearm vectors.

### B. Head Stability (`head.py`)
Calculates the spatial standard deviation of the nose/eye coordinates.
- **Cricket coaching theory:** Head movement must be kept to an absolute minimum during downswing to maintain balance. The eyes must remain horizontal (no significant tilt).
- **Calculation:** Compares head coordinate coordinates across sampled frames against a baseline frame.

### C. Stance Balance (`stance.py`)
Tracks the width and alignment between the ankles relative to shoulder width.
- **Cricket coaching theory:** A stable, balanced stance (ankles roughly aligned with shoulder outer boundaries) provides a strong base for weight transfer.

### D. Footwork Stride (`footwork.py`)
Tracks the linear displacement of the front ankle towards the ball pitch point.
- **Cricket coaching theory:** Stride length determines the batter's reach and ability to get close to the pitch of the ball.

---

## 6. Future Pipeline Scaling (V2+)

The AI architecture is built for clean, frictionless expansion:
- **Bowling/Fielding Pipelines:** The `pipeline/base.py` defines a standard lifecycle. Adding a bowling analysis involves creating a parallel `BowlingPipeline` in `pipeline/bowling_pipeline.py` and a dedicated `bowling/` calculator package under `biomechanics/`.
- **Custom AI Models:** If the startup scales to train a custom posture model, the `PoseEstimator` can be swapped inside `pose/estimator.py` to point to a PyTorch or TensorFlow model. Because the rest of the biomechanics calculators only rely on coordinates, the rest of the library remains completely unaffected.
