# Authentication System — Zesty Platform

Zesty features a multi-role authentication system supporting Email/Password, OTP verification, and Google OAuth 2.0.

---

## 🔑 Authentication Architecture

- **Session Tokens**: Signed JWT tokens stored in HttpOnly, SameSite cookies named `zesty_session`.
- **Password Hashing**: Passwords hashed using bcryptjs with 10 salt rounds.
- **Role Isolation**: User accounts are strictly associated with one of four models: `User`, `FoodPartner`, `DeliveryPartner`, or `Admin`.

---

## 🚀 Key Endpoints

- `POST /api/auth/register` — Register a new Customer, Restaurant Partner, or Delivery Rider account.
- `POST /api/auth/login` — Authenticate existing account with email/password and intended role.
- `POST /api/auth/google` — Authenticate via Google OAuth credential token with intended role verification.
- `GET /api/auth/me` — Retrieve active session profile and verified role.
- `POST /api/auth/logout` — Clear session cookie.
