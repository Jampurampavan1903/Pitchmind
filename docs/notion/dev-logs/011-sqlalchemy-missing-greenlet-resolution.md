# Dev Log #011 — SQLAlchemy MissingGreenlet Exception Resolution

**Date:** 2026-05-27  
**Author:** AntiGravity AI  
**Category:** SQLAlchemy, Async, Bug Fix

---

## 1. Context & Identified Bug

After optimizing background processing and resolving the duplicate video upload database constraint, a new exception was caught in the background processing logs upon executing the heavy machine learning evaluation:

```text
Analysis Interrupted: greenlet_spawn has not been called; can't call await_only() here. Was IO attempted in an unexpected place? (Background on this error at: https://sqlalche.me/e/20/xd2s)
```

---

## 2. Root Cause Analysis

In SQLAlchemy's asynchronous extension (`ext.asyncio`), all database I/O operations must be run in a greenlet context (set up via `greenlet_spawn`). 

In our background task `process_video_task` (`analysis_worker.py`), we executed:
```python
db_video.status = "processing"
db_analysis.status = "processing"
await db.commit()  # <-- Transactions committed successfully
```

By default in SQLAlchemy, calling a transaction `commit()` **expires** all loaded attributes on mapped ORM objects (`db_video` and `db_analysis`). 

Directly following the commit, the background task evaluated arguments to spawn the thread pool executor:
```python
result = await loop.run_in_executor(
    None,
    run_analysis_and_save_visuals,
    db_video.file_path,  # <-- Triggered lazy load attribute refresh
    ...
)
```

Because `db_video.file_path` had been expired by the commit, Python's access of `.file_path` implicitly triggered an on-the-fly database refresh load. However, because this load was called on a plain async coroutine outside of SQLAlchemy's explicit execute/query greenlet wrapper context, it failed with the `MissingGreenlet` exception.

---

## 3. Resolution

We solved this using a double-layered bulletproof approach:

1. **Local Parameter Extraction:** We modified the worker block in `analysis_worker.py` to extract the `file_path` value into a local variable *before* executing the database commit:
   ```python
   video_file_path = db_video.file_path
   
   db_video.status = "processing"
   db_analysis.status = "processing"
   await db.commit()
   
   # Pass local string directly
   result = await loop.run_in_executor(
       None,
       run_analysis_and_save_visuals,
       video_file_path,
       ...
   )
   ```
2. **Sessionmaker Best Practice:** Set `expire_on_commit=False` in the high-performance async session factory (`app/core/database.py`):
   ```python
   AsyncSessionLocal = async_sessionmaker(
       bind=engine,
       autocommit=False,
       autoflush=False,
       expire_on_commit=False,  # Prevents attribute expiration on commit
       class_=AsyncSession
   )
   ```
   This ensures that committed database objects remain fully hydrated and queryable within local session blocks without requiring implicit lazy reloading.

---

## 4. Verification

* **Execution Success:** Running sequential video analysis now proceeds cleanly.
* **Telemetry Verification:** The worker resolves from `extracting_frames` to `saving_results` and `complete` in under a minute without throwing database exceptions.
