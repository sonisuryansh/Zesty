# Google OAuth 2.0 Integration — Zesty Platform

Zesty implements secure Google OAuth 2.0 sign-in with portal role isolation.

---

## 🔄 Execution Sequence

```text
1. User selects Portal Tab (Customer / Partner / Rider)
2. User clicks "Sign in with Google"
3. Google SDK returns ID Credential Token
4. Frontend sends token + intended role to POST /api/auth/google
5. Backend verifies token with Google OAuth Client
6. Backend checks existing account across User, FoodPartner, and DeliveryPartner collections
7. CASE A: Account exists in matching role -> Logged in successfully
8. CASE B: Account exists in DIFFERENT role -> Returns HTTP 409 Conflict with tab switch guidance
9. CASE C: New user -> Creates account in selected role -> Logged in successfully
```

---

## 🛠️ Configuration Requirements

- `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` and `backend/.env`.
- Authorized JavaScript origins in Google Cloud Console: `http://localhost:5173` and `http://localhost:3000`.
