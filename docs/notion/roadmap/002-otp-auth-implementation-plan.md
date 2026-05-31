# Implementation Plan — OTP Auth & Sports Profile Completion

We will build the secure authentication and profile completion subsystem for PitchMind V1. Users will sign up using an OTP sent to their phone number or Gmail account. Upon verifying the OTP, they will complete their profile by selecting their role: **Batsman, Bowler, Wicket Keeper, or Coach**.

---

## User Review Required

We have designed a secure, zero-ops authentication mechanism optimized for development and production:
> [!IMPORTANT]
> **Authentication & OTP Specs:**
> * **OTP Verification:** Verification will accept both phone numbers (any country code) and email addresses. To ensure zero-config installation (no SMS gateway/SMTP setup required), the backend will automatically generate a secure 6-digit OTP code and print it to the terminal console. A development bypass code (`123456`) will also be available for instant testing.
> * **Sports Roles:** During profile completion, the user can select their athletic/coaching role: `batsman`, `bowler`, `wicket_keeper`, or `coach`.
> * **Interactive Mock Navigation:** We will map all sidebar navigation options to functional modal overlays or routes to make the entire UI interactive and responsive.

---

## Proposed Changes

### 1. Backend Models (SQLAlchemy)

#### [NEW] user.py
* Define the `User` and `Profile` ORM models:
  * **`User` Table:** `id` (UUID), `email` (string, nullable), `phone_number` (string, nullable), `is_verified` (boolean), `otp_code` (string), `otp_expires_at` (datetime), `created_at`, `updated_at`.
  * **`Profile` Table:** `id` (UUID), `user_id` (FK to `users.id`), `full_name` (string), `role` (enum: `batsman`, `bowler`, `wicket_keeper`, `coach`), `created_at`, `updated_at`.

#### [MODIFY] main.py
* Import `app.models.user` during startup so the lifespan manager automatically bootstraps the sqlite database schema for users and profiles.
* Register the new `/api/v1/auth` router.

---

### 2. Backend API Routers (FastAPI)

#### [NEW] auth.py
* Implement four endpoints:
  1. `POST /api/v1/auth/signup`: Accepts email or phone number. Generates a 6-digit OTP code, saves it to the database with a 5-minute expiration, prints it to the console, and returns a `verification_id`.
  2. `POST /api/v1/auth/verify-otp`: Accepts `verification_id` and `otp_code`. Verifies the code and marks the user as verified. Returns a simple JWT-like token (containing user ID).
  3. `POST /api/v1/auth/complete-profile`: Accepts the authorization token, `full_name`, and `role`. Inserts or updates the user profile record.
  4. `GET /api/v1/auth/me`: Returns current authenticated user and profile.

---

### 3. Frontend State & UI Gate

#### [NEW] auth-store.ts
* Create a Zustand store managing:
  * Authentication status (`isAuthenticated`, `isVerified`, `user`, `profile`).
  * Sign-up steps (`step`: 'signup' | 'otp' | 'profile').
  * Form actions (`signup()`, `verifyOtp()`, `completeProfile()`, `logout()`).
  * Cache access token in `localStorage` for session persistence.

#### [MODIFY] page-container.tsx
* Inject an authentication gate. If `isAuthenticated` is false, hide the main layout and display the cinematic **Auth Gate** wizard.

#### [NEW] auth-gate.tsx
* Build the multi-step cinematic Auth modal in raw CSS & React:
  * **Step 1 (Sign Up):** Inputs for Email or Phone Number with a country code picker. Custom "Send Verification Code" action button.
  * **Step 2 (OTP):** 6 horizontal individual input boxes for entering the digit codes. Resend timer countdown. Shows a clean helper badge: `(Dev Mode: Enter 123456 to verify instantly)`.
  * **Step 3 (Profile):** Full Name input, followed by 4 beautifully designed role-selection cards (Batsman, Bowler, Wicket Keeper, Coach) with custom SVG icons, details, and active emerald borders.

---

## Verification Plan

### Automated Tests
* Run `python -m pytest` or postman/thunder client tests on `/api/v1/auth/` routes.

### Manual Verification
* Access the app in browser. The login screen should immediately overlay the dashboard.
* Type a mock email/phone, enter `123456` in the OTP page, complete name, select "Batsman", and submit.
* Verify it registers successfully in SQLite, stores the session, unlocks the dashboard, and displays "Rohan Sharma" or your verified profile name!
