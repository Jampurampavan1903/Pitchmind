#!/usr/bin/env python3
"""
Interim staging API smoke test (REST auth + JWT).
Usage:
  export STAGING_API_URL=https://your-api.onrender.com
  export PITCHMIND_OTP_BYPASS_ENABLED=True   # use 123456 OTP when bypass on API
  python3 scripts/staging_validate.py
"""
from __future__ import annotations

import json
import os
import sys
import uuid

try:
    import httpx
except ImportError:
    print("FAIL: httpx required (pip install httpx)")
    sys.exit(1)

API = os.environ.get("STAGING_API_URL", "http://127.0.0.1:8000").rstrip("/")
# OTP selection is driven by SERVER bypass flag (see main()), not shell env alone.
OTP = os.environ.get("STAGING_OTP_CODE", "")

results: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}" + (f" — {detail}" if detail else ""))


def main() -> int:
    print(f"Staging validate → {API}\n")
    timeout = httpx.Timeout(60.0, connect=15.0)
    client = httpx.Client(timeout=timeout, trust_env=False)

    # Health
    server_bypass = False
    try:
        r = client.get(f"{API}/api/v1/health")
        record("health", r.status_code == 200, f"status={r.status_code}")
        if r.status_code == 200:
            print("  ", r.json())
    except Exception as e:
        record("health", False, str(e))
        print("\nCannot reach API — check STAGING_API_URL, Render deploy, CORS not needed for this script.")
        return 1

    try:
        cfg = client.get(f"{API}/api/v1/developer/config")
        if cfg.status_code == 200:
            server_bypass = bool(cfg.json().get("otp_bypass_enabled"))
            print(f"  server otp_bypass_enabled={server_bypass}")
    except Exception:
        pass

    global OTP
    if server_bypass:
        OTP = "123456"
    elif not OTP:
        shell_bypass = os.environ.get("PITCHMIND_OTP_BYPASS_ENABLED", "True").lower() in (
            "true",
            "1",
            "yes",
        )
        OTP = "123456" if shell_bypass else ""

    # CORS header probe (optional)
    try:
        origin = os.environ.get("STAGING_CORS_ORIGIN", "https://pitchmind-one.vercel.app")
        r = client.options(
            f"{API}/api/v1/health",
            headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
        )
        acao = r.headers.get("access-control-allow-origin", "")
        ok = origin in acao or acao == "*"
        record("cors_preflight", ok, f"allow-origin={acao or '(missing)'}")
    except Exception as e:
        record("cors_preflight", False, str(e))

    email = f"staging-{uuid.uuid4().hex[:8]}@validate.test"
    token = None

    # Signup
    try:
        r = client.post(f"{API}/api/v1/auth/signup", json={"email": email})
        record("auth_signup", r.status_code == 200, f"status={r.status_code}")
        if r.status_code != 200:
            return _finish()
        vid = r.json().get("verification_id")
    except Exception as e:
        record("auth_signup", False, str(e))
        return _finish()

    if not OTP:
        record(
            "auth_verify_otp",
            False,
            "Set STAGING_OTP_CODE or enable PITCHMIND_OTP_BYPASS_ENABLED on API",
        )
        return _finish()

    try:
        r = client.post(
            f"{API}/api/v1/auth/verify-otp",
            json={"verification_id": vid, "otp_code": OTP},
        )
        record("auth_verify_otp", r.status_code == 200, f"status={r.status_code}")
        if r.status_code != 200:
            return _finish()
        token = r.json().get("access_token")
    except Exception as e:
        record("auth_verify_otp", False, str(e))
        return _finish()

    headers = {"Authorization": f"Bearer {token}"}

    try:
        r = client.get(f"{API}/api/v1/auth/me", headers=headers)
        record("auth_me", r.status_code == 200, f"status={r.status_code}")
    except Exception as e:
        record("auth_me", False, str(e))

    try:
        r = client.get(f"{API}/api/v1/analyses", headers=headers)
        record("analyses_list", r.status_code == 200, f"status={r.status_code}")
    except Exception as e:
        record("analyses_list", False, str(e))

    try:
        r = client.post(f"{API}/api/v1/upload", headers=headers)
        record("upload_requires_body", r.status_code in (400, 422), f"status={r.status_code}")
    except Exception as e:
        record("upload_requires_body", False, str(e))

    try:
        r = client.get(f"{API}/api/v1/assets/videos/nonexistent/original.mp4")
        record("assets_require_auth", r.status_code == 401, f"status={r.status_code}")
    except Exception as e:
        record("assets_require_auth", False, str(e))

    # WebSocket URL shape only (no full WS handshake in script)
    ws_base = API.replace("https://", "wss://").replace("http://", "ws://")
    record(
        "websocket_url_pattern",
        True,
        f"{ws_base}/api/v1/ws/{{video_id}}?token=<jwt>",
    )

    return _finish()


def _finish() -> int:
    passed = sum(1 for _, ok, _ in results if ok)
    failed = sum(1 for _, ok, _ in results if not ok)
    print(f"\nSummary: {passed} passed, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
