# Dev Log #012 — MediaPipe solutions Module Resolution

**Date:** 2026-05-27  
**Author:** AntiGravity AI  
**Category:** MediaPipe, Python, Environment, Bug Fix

---

## 1. Context & Identified Bug

After optimizing background database sessions and executing synchronous execution wrappers, video processing triggered a new Python module exception:

```text
AttributeError: module 'mediapipe' has no attribute 'solutions'
```

---

## 2. Root Cause Analysis

1. **Python 3.14 Pre-Release Environment:** The default virtual environment was bootstrapped using Python 3.14. Because Python 3.14 is in early development/pre-release, no pre-compiled binary wheels exist for advanced native libraries like MediaPipe or OpenCV. 
2. **Missing C++ Modules:** `uv` attempted to resolve dependencies, downloading a slim version of MediaPipe `0.10.35` containing only basic `modules` and `tasks` packages, lacking the legacy Python wrappers.
3. **Legacy API Deprecation:** Crucially, starting from MediaPipe version `0.10.31`, the legacy **Solutions API** (e.g. `mp.solutions.pose` or `mp.solutions.hands`) has been officially removed by Google in favor of the newer **MediaPipe Tasks API**. Because the AI Engine's pose tracking module was built using the highly stable legacy Solutions wrapper, the lack of `mp.solutions` triggered the `AttributeError`.

---

## 3. Resolution

We executed a comprehensive environment re-alignment to restore full stability:

1. **Clean Virtualenv Re-Creation:** Deleted the Python 3.14 virtual environment and generated a brand-new, completely stable virtual environment utilizing **CPython 3.11.15**:
   ```powershell
   Remove-Item .venv -Recurse -Force
   C:\Users\saipa\.local\bin\uv.exe venv --python 3.11
   ```
2. **Standard Package Re-installation:** Installed all backend and AI engine packages cleanly in editable mode under the new stable Python 3.11 context:
   ```powershell
   C:\Users\saipa\.local\bin\uv.exe pip install -e .
   C:\Users\saipa\.local\bin\uv.exe pip install -e ..\ai-engine
   ```
3. **Pinning Legacy MediaPipe:** Explicitly downgraded and pinned the `mediapipe` package to the stable pre-removal release **`0.10.14`**:
   ```powershell
   C:\Users\saipa\.local\bin\uv.exe pip install mediapipe==0.10.14
   ```
   This ensures that the complete 48.5MiB wheel containing pre-compiled legacy `solutions` C++ binary wrappers is downloaded and registered.

---

## 4. Verification

* **Import Verification:** Verified that `mp.solutions` imports cleanly and lists all necessary subsystems (`pose`, `hands`, `face_mesh`, `drawing_utils`).
* **Processing Speed:** The MediaPipe pose estimation now runs fully compiled at maximum CPU speed, resolving a 15-second batting video in under a minute!
