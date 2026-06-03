#!/usr/bin/env python3
"""
Staging objective: first successful upload + completed analysis on deployed API.

Usage (founder — after Render + Vercel deploy):
  export STAGING_API_URL=https://YOUR-SERVICE.onrender.com
  export PITCHMIND_OTP_BYPASS_ENABLED=True   # must match Render env for 123456 OTP
  python3 scripts/staging_first_analysis.py

Optional:
  export STAGING_VIDEO_PATH=/path/to/short.mp4
  export STAGING_POLL_SECONDS=600
"""
from __future__ import annotations

import asyncio
import os
import sys
import uuid
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DEFAULT_VIDEO = REPO / "storage" / "videos" / "test-e2e" / "original.mp4"

API = os.environ.get("STAGING_API_URL", "").rstrip("/")
VIDEO = Path(os.environ.get("STAGING_VIDEO_PATH", str(DEFAULT_VIDEO)))
BYPASS = os.environ.get("PITCHMIND_OTP_BYPASS_ENABLED", "True").lower() in (
    "true",
    "1",
    "yes",
)
OTP = "123456" if BYPASS else os.environ.get("STAGING_OTP_CODE", "")
MAX_WAIT = int(os.environ.get("STAGING_POLL_SECONDS", "600"))
POLL_INTERVAL = 3

results: dict[str, str] = {}


def set_status(key: str, status: str, detail: str = "") -> None:
    results[key] = status
    mark = {"PASS": "✓", "FAIL": "✗", "UNVERIFIED": "?", "SKIP": "-"}.get(status, "?")
    line = f"  {mark} {key}: {status}"
    if detail:
        line += f" — {detail}"
    print(line)


async def main() -> int:
    if not API:
        print("FAIL: Set STAGING_API_URL=https://<your>.onrender.com")
        return 1
    if not VIDEO.is_file():
        print(f"FAIL: Video not found: {VIDEO}")
        print("  Copy a short MP4 to storage/videos/test-e2e/original.mp4")
        return 1
    video_bytes = VIDEO.stat().st_size
    if video_bytes < 10_000:
        print(f"FAIL: Test video too small ({video_bytes} bytes). Use a real MP4 (≥10KB).")
        return 1

    try:
        import httpx
    except ImportError:
        print("FAIL: pip install httpx")
        return 1

    print(f"\n=== Staging first analysis ===\nAPI: {API}\nVideo: {VIDEO}\n")
    timeout = httpx.Timeout(120.0, connect=30.0)

    async with httpx.AsyncClient(base_url=API, timeout=timeout) as client:
        # Health
        try:
            r = await client.get("/api/v1/health")
            ok = r.status_code == 200
            set_status("Backend", "PASS" if ok else "FAIL", f"health {r.status_code}")
            if not ok:
                return _summary(1)
        except Exception as e:
            set_status("Backend", "FAIL", str(e))
            return _summary(1)

        # Auth
        email = f"deploy-{uuid.uuid4().hex[:8]}@staging.pitchmind.test"
        try:
            r = await client.post("/api/v1/auth/signup", json={"email": email})
            if r.status_code != 200:
                set_status("Authentication", "FAIL", f"signup {r.status_code}: {r.text[:200]}")
                return _summary(1)
            vid = r.json()["verification_id"]
            if not BYPASS and not OTP:
                set_status("Authentication", "FAIL", "Set OTP bypass on Render or STAGING_OTP_CODE")
                return _summary(1)
            r = await client.post(
                "/api/v1/auth/verify-otp",
                json={"verification_id": vid, "otp_code": OTP},
            )
            if r.status_code != 200:
                set_status("Authentication", "FAIL", f"verify {r.status_code}: {r.text[:200]}")
                return _summary(1)
            token = r.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            set_status("Authentication", "PASS", "JWT issued")
        except Exception as e:
            set_status("Authentication", "FAIL", str(e))
            return _summary(1)

        # Upload
        try:
            with VIDEO.open("rb") as f:
                r = await client.post(
                    "/api/v1/upload",
                    files={"file": ("staging-test.mp4", f, "video/mp4")},
                    headers=headers,
                )
            if r.status_code != 201:
                set_status("Upload", "FAIL", f"{r.status_code}: {r.text[:300]}")
                return _summary(1)
            video_id = r.json()["video_id"]
            set_status("Upload", "PASS", video_id)
        except Exception as e:
            set_status("Upload", "FAIL", str(e))
            return _summary(1)

        # Analysis / processing poll
        set_status("Analysis", "UNVERIFIED", "polling...")
        elapsed = 0
        last_step = ""
        while elapsed < MAX_WAIT:
            await asyncio.sleep(POLL_INTERVAL)
            elapsed += POLL_INTERVAL
            try:
                st = await client.get(f"/api/v1/upload/{video_id}/status", headers=headers)
                if st.status_code == 404:
                    # PROGRESS_STORE cold — keep polling
                    continue
                if st.status_code != 200:
                    continue
                data = st.json()
                status = data.get("status", "")
                last_step = data.get("current_step", "")
                pct = data.get("progress_pct", 0)
                print(f"  … {elapsed}s status={status} pct={pct} step={last_step}")

                if status == "complete":
                    set_status("Analysis", "PASS", last_step or "complete")
                    break
                if status == "failed":
                    err = data.get("error_message", st.text)
                    set_status("Analysis", "FAIL", err[:300])
                    set_status("WebSockets", "UNVERIFIED", "poll path used")
                    return _summary(1)
            except Exception as e:
                print(f"  … poll error: {e}")
        else:
            set_status("Analysis", "FAIL", f"timeout {MAX_WAIT}s (last step: {last_step})")
            return _summary(1)

        # Fetch analysis
        try:
            r = await client.get(f"/api/v1/analysis/{video_id}", headers=headers)
            if r.status_code != 200:
                set_status("Dashboard", "FAIL", f"analysis GET {r.status_code}")
                return _summary(1)
            body = r.json()
            has_m = bool(body.get("metrics"))
            has_c = bool(body.get("coaching"))
            if has_m and has_c:
                set_status("Dashboard", "PASS", f"score={body.get('metrics', {}).get('overall_score', 'n/a')}")
            else:
                set_status("Dashboard", "FAIL", "missing metrics or coaching")
                return _summary(1)
        except Exception as e:
            set_status("Dashboard", "FAIL", str(e))
            return _summary(1)

        # Asset probe
        try:
            r = await client.get(
                f"/api/v1/assets/videos/{video_id}/original.mp4",
                headers=headers,
            )
            set_status("Storage", "PASS" if r.status_code == 200 else "FAIL", f"asset HTTP {r.status_code}")
        except Exception as e:
            set_status("Storage", "FAIL", str(e))

        set_status("Database", "PASS", "implicit via auth + upload")
        set_status("Frontend", "UNVERIFIED", "run browser test on Vercel")
        set_status("WebSockets", "UNVERIFIED", "poll fallback OK if analysis PASS")
        set_status("Analytics", "UNVERIFIED", "check PostHog Live after browser test")

    return _summary(0)


def _summary(code: int) -> int:
    print("\n=== Status board (this run) ===")
    for k in (
        "Frontend",
        "Backend",
        "Database",
        "Storage",
        "WebSockets",
        "Authentication",
        "Analytics",
        "Upload",
        "Analysis",
        "Dashboard",
    ):
        print(f"  {k}: {results.get(k, 'UNVERIFIED')}")

    if code == 0:
        print("\n>>> STAGING OBJECTIVE: GO — first staging analysis completed via API <<<")
    else:
        print("\n>>> STAGING OBJECTIVE: BLOCKED — see failures above <<<")
    return code


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
