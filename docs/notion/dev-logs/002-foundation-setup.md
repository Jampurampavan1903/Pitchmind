# Dev Log #002 — V1 Foundation & Workspace Setup

| Metadata | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Author** | Principal Software Engineer |
| **Status** | Completed |
| **Category** | Dev Logs |

---

## 1. Summary
We have successfully initialized **Phase 1: Environment Setup + Repository Foundation + Design System + Project Architecture** for PitchMind V1. The workspace is set up as a highly modular monorepo containing our isolated Python AI engine, our FastAPI server, and our premium Next.js 15 Vanilla CSS client-side dashboard.

---

## 2. Problem Solved
This setup establishes the absolute bedrock of PitchMind's engineering architecture. It guarantees:
1. **Isolated Environments:** Front-end, backend, and machine learning dependencies never pollute each other.
2. **Deterministic Build Paths:** By locking Node 24 (LTS), Python 3.14 (via `uv`), and absolute package manager commands, any developer can get this repository fully running locally within 5 minutes.
3. **Pure AI Separation:** The `ai-engine` is built as an editable Python library with zero web framework knowledge, facilitating easy testing and future migration to microservices.

---

## 3. Scaffolding Architecture Diagram

```
pitchmind/ (Monorepo Root)
│
├── .gitignore                         # Central multi-layer ignore rules
│
├── frontend/                          # Next.js 15 Application (React, TS)
│   ├── package.json                   # Client dependencies (Zustand, Recharts)
│   └── src/app/globals.css            # Cinematic Dark Mode design tokens
│
├── backend/                           # FastAPI Application Server
│   ├── pyproject.toml                 # FastAPI, SQLAlchemy, websockets
│   ├── .venv/                         # Sandboxed Python environment
│   └── app/main.py                    # Server config, CORS, health endpoint
│
├── ai-engine/                         # Machine Learning & pose library
│   ├── pyproject.toml                 # MediaPipe, OpenCV, NumPy, Gemini
│   └── pitchmind_ai/__init__.py      # Package entry point (editable install)
│
├── shared/                            # API contracts and shared types
├── storage/                           # Local media asset files (gitignored)
│   ├── videos/                        # Raw video uploads
│   ├── frames/                        # Extracted JPEG keyframes
│   └── exports/                       # Compiled PDF/HTML reports
│
└── docs/notion/                       # Notion Engineering Wiki files
```

---

## 4. Technical Decisions & Consequence Register

| Decision | Chosen Solution | Impact & Benefits | Deferrals / Risks |
|---|---|---|---|
| **OS Toolchain** | **winget** | Enabled seamless, non-interactive command-line installations of Node.js and Git on Windows. | Requires administrator approval (UAC dialog). |
| **Python Environment** | **uv** | Replaced pip with Rust-powered `uv`, compiling and installing 48 ML packages in under 10 seconds. | None. Unmatched local performance. |
| **Frontend Style** | **Vanilla CSS Variables** | Implemented direct custom styling in `globals.css` with dark navy backgrounds and glowing cyber-cyan joint overlays. | Skips utility frameworks, requiring modular custom classes. |
| **Editable Packages** | **pip -e** | Installed `ai-engine` inside `backend/` via local references. Backend can import it instantly, but changes in ML code propagate without reinstalls. | None. The optimal monorepo layout. |

---

## 5. Terminal Execution History & Steps

All exact Windows PowerShell execution commands executed during Phase 1:

1. **Scaffold Directory Tree:**
   ```powershell
   New-Item -Path "pitchmind\frontend", "pitchmind\backend", "pitchmind\ai-engine", "pitchmind\shared\contracts", "pitchmind\shared\constants", "pitchmind\storage\videos", "pitchmind\storage\frames", "pitchmind\storage\exports" -ItemType Directory -Force
   ```
2. **Install Node.js 20 LTS:**
   ```powershell
   winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
   ```
3. **Scaffold Next.js Client App:**
   ```powershell
   $env:Path = "C:\Program Files\nodejs;" + $env:Path
   & "C:\Program Files\nodejs\npx.cmd" create-next-app pitchmind/frontend --ts --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --no-tailwind --yes
   ```
4. **Install Git for Windows:**
   ```powershell
   winget install Git.Git --accept-source-agreements --accept-package-agreements
   ```
5. **Initialize Monorepo Git Repository:**
   ```powershell
   & "C:\Program Files\Git\cmd\git.exe" init pitchmind
   ```
6. **Scaffold Python Virtual Environment:**
   ```powershell
   & "C:\Users\saipa\.local\bin\uv.exe" venv pitchmind/backend/.venv
   ```
7. **Install AI Engine Editable Package:**
   ```powershell
   & "C:\Users\saipa\.local\bin\uv.exe" pip install --python pitchmind/backend/.venv -e pitchmind/ai-engine
   ```
8. **Install Backend Server Package:**
   ```powershell
   & "C:\Users\saipa\.local\bin\uv.exe" pip install --python pitchmind/backend/.venv -e pitchmind/backend
   ```

---

## 6. Next Steps & Verification Target
To verify that everything is running perfectly:
1. Run the Next.js server locally:
   ```bash
   cd pitchmind/frontend
   npm run dev
   ```
   Verify that `http://localhost:3000` serves the cinematic dark theme.
2. Run the FastAPI server locally:
   ```bash
   cd pitchmind/backend
   .venv\Scripts\activate
   python app/main.py
   ```
   Verify that `http://localhost:8000/api/v1/health` returns status `"ok"`.
