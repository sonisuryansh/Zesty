# Frontend Google OAuth Specifications — Zesty Application

Frontend integration specs for Google Identity Services SDK (`accounts.google.com/gsi/client`).

---

## ⚡ Integration Mechanism

- Loads Google GSI script dynamically in `index.html`.
- Initializes `google.accounts.id.initialize` with `VITE_GOOGLE_CLIENT_ID`.
- Renders Google Sign-In button inside `AuthModal`.
- Transmits credential token + active modal tab role to `POST /api/auth/google`.
