# 🌐 Google OAuth 2.0 Integration — Zesty

Zesty implements Google OAuth 2.0 authentication for Customers, Restaurant Partners, and Delivery Riders while enforcing role isolation and account linking by verified email address.

---

## 🔁 Flow Overview

```text
User selects portal tab (Customer / Restaurant / Delivery Rider)
                       │
                       ▼
Click "Continue with Google" (<GoogleLogin />)
                       │
                       ▼
Google OAuth Pop-up & User Verification
                       │
                       ▼
Frontend receives ID Token (credential)
                       │
                       ▼
POST /api/auth/google { idToken, role: "user" | "foodpartner" | "delivery" }
                       │
                       ▼
Backend verifies idToken via googleClient.verifyIdToken()
                       │
                       ▼
Backend checks for cross-role mismatch across all models
 ├── If email registered under DIFFERENT role -> Return 409 Conflict
 └── If role matches or new user -> Link googleId & create session
                       │
                       ▼
Issue HttpOnly JWT session cookies & return user profile
```

---

## 🛡️ Role Isolation & Mismatch Rules

- **Role Mismatch Safeguard**: If a Google account is registered as a Customer, attempting to sign in on the Delivery Rider tab returns `409 Conflict` with message `"This Google account is registered as a Customer. Switch to the Customer Login tab."`.
- **Super Admin Protection**: Requests with `role: "admin"` are rejected with `403 Forbidden`.
