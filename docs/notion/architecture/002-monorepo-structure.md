# PitchMind — Monorepo & Project Structure

| Metadata | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Author** | Principal Architect |
| **Status** | Approved |
| **Category** | Dev Setup & Structure |

---

## 1. Summary

This document defines and locks the workspace directory structure for PitchMind. To maintain a fast pace of development while ensuring absolute code and dependency boundaries, the codebase is structured as a **modular monorepo**. This allows the frontend, backend, and AI engine to live in a single repository while keeping their development environments completely separated.

---

## 2. Problem Statement

Multi-repo (polyrepo) architectures for early-stage AI startups introduce a high degree of operational friction:
1. **API Desynchronization:** Changes to API contracts require making separate commits across multiple repos, leading to drift.
2. **Setup Overhead:** Developers must clone, configure, and manage dependencies across three separate codebases.
3. **Atomic Commits:** It is difficult to release a new feature (which includes a new AI calculation, backend endpoint, and frontend chart) under a single pull request.

At the same time, a naive single-folder monorepo can lead to dependency pollution, where ML libraries (like OpenCV or MediaPipe) get mixed into the web backend, or React packages clutter the root environment.

---

## 3. Rationale: Why Monorepo over Polyrepo

We choose a **modular monorepo** using clean directory separation:
- **Single Source of Truth:** API contracts, shared constants, and database schemas live in a unified space (`shared/` and `docs/`).
- **Atomic Features:** A developer can implement an end-to-end feature (AI biomechanics calculation → API route → Dashboard chart) in a single pull request.
- **Strict Package Isolation:** Node.js dependencies (`frontend/package.json`), backend server dependencies (`backend/pyproject.toml`), and AI code dependencies (`ai-engine/pyproject.toml`) are completely isolated.

---

## 4. The Complete Monorepo Directory Tree

```
pitchmind/
│
├── .vscode/                              # VS Code Workspace Configuration
│   ├── settings.json                     # Code formatting, rulers, import sorting rules
│   ├── extensions.json                   # Recommended extensions (Pylance, ESLint, SQLite Viewer)
│   └── launch.json                       # Local debugging profiles for Next.js, FastAPI & pytest
│
├── frontend/                             # Next.js 15 Client-Side Web Application
│   ├── src/
│   │   ├── app/                          # App Router (pages & layouts)
│   │   ├── components/                   # Core design system & shared UI primitives
│   │   ├── features/                     # Feature-scoped layouts and components
│   │   ├── hooks/                        # Global reusable hooks
│   │   ├── lib/                          # HTTP client and formatting utilities
│   │   ├── stores/                       # Zustand stores for state management
│   │   └── styles/                       # CSS custom properties and resets
│   ├── package.json                      # npm dependencies
│   └── tsconfig.json                     # TypeScript configuration
│
├── backend/                              # FastAPI Web Server & Background Tasks
│   ├── app/
│   │   ├── api/                          # HTTP endpoint handlers (V1)
│   │   ├── core/                         # App settings, DB connections, CORS policies
│   │   ├── models/                       # SQLAlchemy Database Models
│   │   ├── schemas/                      # Pydantic validation schemas
│   │   ├── services/                     # Business logic layer
│   │   └── workers/                      # Background task workers (consumes ai-engine)
│   ├── alembic/                          # DB Migration Scripts
│   ├── pyproject.toml                    # Poetry/pip environment configuration
│   └── tests/                            # Unit and integration tests
│
├── ai-engine/                            # Pure Python AI & Biomechanics Package
│   ├── pitchmind_ai/
│   │   ├── pipeline/                     # Orchestration pipeline
│   │   ├── extractors/                   # Frame extraction (OpenCV)
│   │   ├── pose/                         # MediaPipe wrappers
│   │   ├── biomechanics/                 # Mathematical calculations
│   │   ├── coaching/                     # Rule engine + Gemini API
│   │   └── models/                       # Pure Python data classes (no web deps)
│   ├── pyproject.toml                    # Pure Python dependencies (MediaPipe, OpenCV, NumPy)
│   └── tests/                            # Pytest suite for joint calculations
│
├── shared/                               # Cross-layer schemas and types
│   ├── contracts/                        # JSON Schemas for requests/responses
│   └── constants/                        # Shared enums (e.g. analysis statuses)
│
├── storage/                              # gitignored local storage
│   ├── videos/                           # Raw uploaded video files
│   ├── frames/                           # Extracted frame image files
│   └── exports/                          # Generated documents
│
├── docs/                                 # Centralized system documentation
│   └── notion/                           # Exportable Notion Wiki structure
│
└── Makefile                              # Automation script for setup and startup
```

---

## 5. Dependency Flow & Boundary Protection

```
               ┌───────────────────────┐
               │       frontend        │ (Next.js Node App)
               └──────────┬────────────┘
                          │
                      HTTP / WS
                          │
                          ▼
               ┌───────────────────────┐
               │        backend        │ (FastAPI Server)
               └──────────┬────────────┘
                          │
                    Python Import
                    (Local Package)
                          │
                          ▼
               ┌───────────────────────┐
               │       ai-engine       │ (Pure Python Package)
               └───────────────────────┘
```

### Dependency Isolation Rules

1. **`ai-engine` is completely isolated:** It must NEVER import any modules or libraries from `backend/` or `frontend/`. It utilizes Python's built-in `dataclasses` and standard libraries for structured data, containing no web framework dependencies (no FastAPI, no SQLAlchemy).
2. **`backend` consumes `ai-engine` as a local library:** The backend installs the AI engine locally in editable mode:
   ```bash
   pip install -e ../ai-engine
   ```
   This allows developers to modify AI logic in the `ai-engine/` directory and see immediate updates in the FastAPI server without reinstalling.
3. **`frontend` communicates only over HTTP/WS:** No code, types, or dependencies are imported from Python into the React project. All JSON request/response formats are defined in `shared/contracts/` to serve as a bridge.

---

## 6. Gitignore and Local Storage Strategy

The `storage/` directory, located at the root of the project, contains all massive media assets. To prevent accidental commits of video uploads and frames to Git, the root `.gitignore` blocks:
- `storage/videos/`
- `storage/frames/`
- `storage/exports/`
- `*.db` (SQLite local database files)
- `.venv/` (Python virtual environments)
- `node_modules/` and `.next/`

This ensures that the repository remains incredibly lightweight, while the `scripts/setup.ps1` script creates the physical directories automatically during the local development setup.
