# Dev Log #008 — OTP Authentication & Role Profile Completion System

| Metadata | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Author** | Principal Security & Backend Engineer |
| **Status** | Completed |
| **Category** | Dev Logs |

---

## 1. Summary
We have successfully implemented the secure **OTP Authentication and Sports Profile Role Selection system** for the PitchMind platform. Users can now sign up using their mobile phone number (from any country) or Gmail/email address. Upon verifying their identity via a 6-digit secure OTP, they are routed to a profile completion step where they enter their name and select their athletic focus: **Batsman, Bowler, Wicket Keeper, or Coach**.

---

## 2. Technical Implementation details

### A. Database ORM Schemas (`backend/app/models/user.py`)
* **`users` Table:**
  * Maps UUID primary keys `id` (as a string).
  * Unique nullable index columns for `email` and `phone_number`.
  * Boolean active flag `is_verified` representing verification outcomes.
  * OTP tracking fields `otp_code` and `otp_expires_at` (datetime objects).
* **`profiles` Table:**
  * Maps profile IDs to verified `user_id` Foreign Keys.
  * Columns for display names `full_name` and athletic enums `role` (batsman, bowler, wicket_keeper, coach).
* **SQLite Bootstraps (`backend/app/main.py`):**
  * Imported the `user` model so SQLite automatically creates both tables during app startup.

### B. Validation Schemas & API Routes (`backend/app/api/v1/auth.py`)
* **Signup API (`/signup`):**
  * Checks inputs, generates secure random 6-digit OTP codes, sets a 5-minute expiration window, and prints the OTP code to the terminal console for seamless development checks.
* **OTP Verification API (`/verify-otp`):**
  * Validates OTP codes.
  * **Dev Bypass:** Installs a development bypass code (`123456`) that allows instant verification without checking console logs.
* **Profile Completion API (`/complete-profile`):**
  * Parses Bearer auth headers, verifies account status, and inserts or updates the profiles model.
* **Session Restoration API (`/me`):**
  * Restores verified users and profile structures on active page reloads.

### C. Frontend Auth Gate Layout Locks (`components/layout/page-container.tsx`)
* Protected all dashboard views using an authentication gate. If `isAuthenticated` is false, all navigation elements and header structures are hidden, rendering the **Auth Gate** wizard instead.
* Integrated `useEffect` hooks in `page-container.tsx` that trigger `initializeSession()` on first mount to check for cached session tokens in `localStorage`.

### D. Multi-Step Auth Gate UX (`components/ui/auth-gate.tsx`)
* **Step 1 (Sign Up):** Selector switches for Phone Numbers (+91 prefixed) vs Email Addresses. Custom action buttons to dispatch OTP requests.
* **Step 2 (OTP Pins):** 6 styled horizontal numeric inputs. Custom key events handle focuses and backspaces. Includes a bypass helper alert.
* **Step 3 (Role Selector):** A name input and **4 custom role selection cards** decorated with SVGs and Turf Emerald highlights (Batsman, Bowler, Wicket Keeper, Coach).

---

## 3. Scaffolding Modules Directory Log

| Component File Path | Operations | Purpose & Implementation |
|---|---|---|
| **`models/user.py`** | **NEW** | Added SQLAlchemy models for `User` and `Profile` tables. |
| **`schemas/auth.py`** | **NEW** | Added Pydantic schemas validating payloads for signup, verify, and complete-profile. |
| **`api/v1/auth.py`** | **NEW** | Added FastAPI routers handling secure verification, bypass rules, and profile bindings. |
| **`main.py`** | **MODIFY** | Registered ORM user models for startup database creation and included auth endpoints. |
| **`stores/auth-store.ts`** | **NEW** | Added Zustand auth store for caching access tokens and managing multi-step wizard state. |
| **`components/ui/auth-gate.tsx`** | **NEW** | Created multi-step authentication gate component for logins, pins verification, and role setups. |
| **`components/layout/page-container.tsx`** | **MODIFY** | Injected session verification check gates to lock all workspace layouts. |

---

## 4. Verification Status
* **API Compilation:** Uvicorn server compiled all new models and auto-created the database tables. Swagger docs are verified at `/docs`.
* **Frontend Compilation:** Next.js Turbopack compiled all auth stores and overlay gates cleanly.
* **Notion Wiki Integration:** Synced the **OTP Auth Implementation Plan** and **Dev Log #008** successfully to Notion.
