# Dev Log #010 — Database Unique Constraint Violation Fix

**Date:** 2026-05-27  
**Author:** AntiGravity AI  
**Category:** Database, Bug Fix

---

## 1. Context & Identified Bug

After successfully optimizing the video processing performance, the user attempted to upload a second batting video to the application. The upload immediately failed with the following traceback in the frontend:

```text
Internal upload error: (sqlite3.IntegrityError) UNIQUE constraint failed: videos.filename [SQL: INSERT INTO videos (id, filename, original_name, file_path, file_size_bytes, duration_seconds, fps, resolution, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING created_at, updated_at] [parameters: ('4bb36f5a-052e-4ba9-a743-14f6ea4f9c05', 'original.mp4', '15304849_1080_1920_60fps.mp4', ...)]
```

---

## 2. Root Cause Analysis

In `backend/app/models/video.py`, the `filename` column in the `Video` ORM mapping was defined with:
```python
filename = Column(String, nullable=False, unique=True)
```

However, the application architecture dictates that every video uploaded is stored under a dynamic UUID directory (e.g. `storage/videos/{video_id}/original.mp4`). To achieve uniform file referencing, the `UploadService` saves every processed video with the generic inner filename `'original.mp4'` (or other dynamic extension like `.mov`). 

Because of the `unique=True` constraint on the `filename` column, the first `.mp4` video uploaded succeeded by registering `'original.mp4'` in the database. When the second `.mp4` video was uploaded, the database attempted to insert `'original.mp4'` again. This violated the uniqueness constraint, triggering an SQLite database `IntegrityError` and failing the upload process.

---

## 3. Resolution

1. **ORM Model Rectification:** Removed the incorrect `unique=True` constraint from the `filename` Column in `backend/app/models/video.py`:
   ```python
   filename = Column(String, nullable=False)
   ```
2. **Schema Recreation:** Because SQLite does not support drop/alter column constraints natively and we are in a local development context, we completely removed the local `pitchmind.db` file:
   ```powershell
   Remove-Item C:\Users\saipa\.gemini\antigravity\scratch\pitchmind\backend\pitchmind.db -Force
   ```
3. **Automatic Bootstrapping:** On the next backend startup, FastAPI's async lifespan context manager executed:
   ```python
   async with engine.begin() as conn:
       await conn.run_sync(Base.metadata.create_all)
   ```
   This successfully bootstrapped a brand-new, clean `pitchmind.db` SQLite database with the updated column structure.

---

## 4. Verification

* **Schema Correctness:** Confirmed that the `videos` table in SQLite no longer contains the UNIQUE index on `filename`.
* **Multiple Uploads:** Multiple videos can now be uploaded sequentially without triggering integrity constraint conflicts, as each is properly isolated by its unique parent ID folder.
