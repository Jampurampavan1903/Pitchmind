# PitchMind — Frontend Architecture

| Metadata | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Author** | Lead Frontend Engineer |
| **Status** | Approved |
| **Category** | Frontend Architecture |

---

## 1. Summary

The PitchMind frontend is a modern, responsive single-page dashboard built using **Next.js 15 (App Router)** and **TypeScript**. It is designed to feel highly premium, rich, and responsive. The interface visualizes cricket batting video analyses, featuring real-time upload progress, interactive pose skeleton overlays on video frames, biomechanical angle line charts, stance radars, and clean AI-generated coaching recommendations.

---

## 2. Technical Decisions & Rationale

- **Framework: Next.js 15 (App Router):** Leverages React Server Components (RSC) for extremely fast loading times of dashboard statistics while maintaining client-side interactivity.
- **State Management: Zustand:** A lightweight, hook-based state management library (1KB minified). It replaces the boilerplate of Redux and avoids the performance and re-render issues associated with the native React Context API.
- **Styling: Vanilla CSS & CSS Variables:** Instead of adopting bulky UI frameworks, the system uses custom Vanilla CSS powered by CSS Custom Properties (Design Tokens). This guarantees total visual control, clean transitions, and absolute performance with zero build-time overhead.
- **Visualizations: Recharts:** An incredibly flexible, React-native SVG charting library. It perfectly fits our requirement for line graphs, radar charts, and score gauges.
- **Animations: Framer Motion:** Used to create fluid micro-animations (e.g., hover effects, card expansions, sidebars, progress indicators) that make the application feel premium and alive.

---

## 3. Directory Layout

The frontend uses a structured, modular design within the `src/` folder:

```
frontend/src/
│
├── app/                                  # App Router (pages and layouts)
│   ├── layout.tsx                        # Root HTML & body structure
│   ├── page.tsx                          # Redirects to dashboard
│   ├── globals.css                       # imports styles
│   └── (dashboard)/                      # Route group sharing dashboard shell
│       ├── layout.tsx                    # Shared Sidebar + Header shell
│       ├── dashboard/page.tsx            # Main overview
│       ├── upload/page.tsx               # Drag-and-drop video upload
│       ├── analysis/[id]/page.tsx        # Technical video evaluation page
│       └── history/page.tsx              # Historical reports page
│
├── components/                           # Shared / Reusable Components
│   ├── ui/                               # Atomic design primitive elements
│   │   ├── button.tsx, card.tsx, badge.tsx, progress-bar.tsx, skeleton.tsx, modal.tsx
│   ├── layout/                           # Global layout blocks (sidebar, header)
│   └── feedback/                         # Error-boundaries, empty/loading-states
│
├── features/                             # Feature-Scoped Modules
│   ├── upload/                           # Upload page components, hooks, api
│   ├── analysis/                         # Evaluation components (PoseOverlay, metrics)
│   └── dashboard/                        # Statistics overview, lists
│
├── hooks/                                # Global helper hooks (useWebSocket)
├── lib/                                  # HTTP Client (api-client.ts), formatters
├── stores/                               # Zustand stores (upload, analysis, ui)
└── styles/                               # Theme design tokens, resets
```

---

## 4. Feature Modularization Rules

To prevent codebases from decaying as features grow, the frontend implements a **Feature-Scoped Organization**:
1. **Feature Directory Structure:** Each folder under `features/` (like `upload/` or `analysis/`) is entirely self-contained. It contains its own `components/` (UI strictly used by that feature), `hooks/` (feature-scoped React hooks), and `api.ts` (API fetch queries).
2. **Promotion Rule:** If a component (e.g. `video-preview.tsx`) is originally built inside `features/upload/` but is later needed by the `analysis/` page, it is promoted out of the feature folder and placed in the globally shared `components/` folder.
3. **No Cross-Feature Imports:** Feature folders must never import directly from other feature folders. Communication between features must happen through shared Zustand stores in `src/stores/`.

---

## 5. Design System Tokens (CSS Custom Properties)

The visual design is grounded in a dark, sleek sports-tech aesthetic defined in `styles/tokens.css`:

```css
:root {
  /* Brand Colors */
  --color-background: #0b0c10;       /* Near-black deep background */
  --color-surface: #1f2833;          /* Dark gray surface cards */
  --color-primary: #1b4d3e;          /* Deep cricket green primary */
  --color-primary-light: #2c6b56;    /* Hover green */
  --color-accent: #45f3ff;           /* Electric cyan for pose tracking */
  
  /* Status Colors */
  --color-success: #2ecc71;          /* Good biomechanical alignment */
  --color-warning: #f1c40f;          /* Noticeable posture tilt */
  --color-danger: #e74c3c;           /* Critical angle deviation */
  
  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace; /* Used for metrics numbers */
  
  /* Layout */
  --sidebar-width: 260px;
  --header-height: 70px;
  --border-radius: 12px;
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 6. Client-Side State Management

We use distinct, isolated **Zustand** stores:
- **`uploadStore`:** Tracks current file upload state, progress percentage, network speed, and server processing status.
- **`analysisStore`:** Stores the active video frame list, pose landmarks sequence, computed joint angles, and active frame index (used to sync the video scrubber with metrics charts).
- **`uiStore`:** Manages sidebar expansion, theme selection, and alert notifications.

---

## 7. Future Visual Scaling (V2+)

The UI architecture is built to seamlessly scale:
- **Overlay Rendering:** The `pose-overlay.tsx` component is modularized to accept a list of skeletal coordinate lines. For V2, adding a bowler's skeleton is as simple as sending a different array of coordinates (e.g., knee joint, shoulder release) without modifying the player core.
- **Metric Grids:** The dashboard utilizes CSS grid layouts that adjust automatically. When wicketkeeping or fielding metrics are added, the dashboard handles them dynamically based on the category API response.
