import urllib.request
import urllib.error
import json
import sys
import sqlite3
import os

def get_otp_from_db(verification_id):
    """Safely retrieves the generated OTP code from the SQLite database for test verification."""
    db_path = "pitchmind.db"
    if not os.path.exists(db_path):
         # Try parent directory if run from tests folder
         db_path = "../pitchmind.db"
         
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT otp_code FROM users WHERE id = ?", (verification_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def test_live_api():
    print("[TEST] STARTING LIVE INTEGRATION TEST AGAINST RUNNING FASTAPI BACKEND...")
    base_url = "http://127.0.0.1:8000/api/v1"

    # Step 1: POST /auth/signup
    signup_url = f"{base_url}/auth/signup"
    signup_data = json.dumps({
        "email": "integration_test@pitchmind.com"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        signup_url,
        data=signup_data,
        headers={"Content-Type": "application/json"}
    )
    
    print("\n[STEP 1] Dispatching sign-up request to live API...")
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print(f"-> Received signup response: {res_body}")
            verification_id = res_body["verification_id"]
            assert verification_id is not None
            print("SUCCESS: Sign-up verified successfully!")
    except Exception as e:
        print(f"ERROR: Step 1 failed: {e}")
        sys.exit(1)

    # Step 2: Retrieve actual generated OTP from SQLite (Bypass is False)
    otp_code = get_otp_from_db(verification_id)
    print(f"\n[INFO] Queried SQLite database. Found real generated OTP: {otp_code}")
    if not otp_code:
        print("ERROR: Generated OTP was not found in SQLite users table!")
        sys.exit(1)

    # Step 3: POST /auth/verify-otp using the real generated OTP
    verify_url = f"{base_url}/auth/verify-otp"
    verify_data = json.dumps({
        "verification_id": verification_id,
        "otp_code": otp_code
    }).encode("utf-8")
    
    req = urllib.request.Request(
        verify_url,
        data=verify_data,
        headers={"Content-Type": "application/json"}
    )
    
    print("\n[STEP 3] Dispatching OTP verification with real code...")
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print(f"-> Received verification response: {res_body}")
            access_token = res_body["access_token"]
            assert access_token is not None
            assert len(access_token) > 50  # Must be a long signed JWT
            print("SUCCESS: Signed JWT access token received successfully!")
    except Exception as e:
        print(f"ERROR: Step 3 failed: {e}")
        sys.exit(1)

    # Step 4: GET /auth/me with Bearer token
    me_url = f"{base_url}/auth/me"
    req = urllib.request.Request(
        me_url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    )
    
    print("\n[STEP 4] Fetching user profile using Bearer JWT...")
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print(f"-> Received profile details: {res_body}")
            assert res_body["email"] == "integration_test@pitchmind.com"
            print("SUCCESS: Profile successfully validated using decoded JWT payload!")
    except Exception as e:
        print(f"ERROR: Step 4 failed: {e}")
        sys.exit(1)

    # Step 5: GET /auth/me with TAMPERED Bearer token
    tampered_token = access_token[:-10] + "xyz1234567"
    req = urllib.request.Request(
        me_url,
        headers={
            "Authorization": f"Bearer {tampered_token}",
            "Content-Type": "application/json"
        }
    )
    
    print("\n[STEP 5] Fetching profile with a TAMPERED JWT signature...")
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            print("ERROR: Security failure: Profile successfully returned for a tampered token signature!")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        print(f"-> Received expected HTTP error code: {e.code}")
        assert e.code == 401
        print("SUCCESS: Tampered signature correctly blocked with 401 Unauthorized!")
    except Exception as e:
        print(f"ERROR: Step 5 failed: {e}")
        sys.exit(1)

    # Step 6: Verify dev bypass code "123456" is now correctly BLOCKED
    print("\n[STEP 6] Verifying dev bypass code '123456' is now correctly blocked...")
    verify_data_bypass = json.dumps({
        "verification_id": verification_id,
        "otp_code": "123456"
    }).encode("utf-8")
    
    req_bypass = urllib.request.Request(
        verify_url,
        data=verify_data_bypass,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req_bypass, timeout=5) as response:
            print("ERROR: Security failure: Dev bypass code '123456' was accepted despite bypass being disabled!")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        print(f"-> Received expected HTTP error code for bypass attempt: {e.code}")
        assert e.code == 400
        print("SUCCESS: Dev bypass OTP correctly rejected with 400 Bad Request!")
    except Exception as e:
        print(f"ERROR: Step 6 failed: {e}")
        sys.exit(1)

    print("\nSUCCESS: ALL 6 LIVE INTEGRATION TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_live_api()
