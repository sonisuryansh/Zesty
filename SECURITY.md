# Security & Compliance Specification — Zesty Platform

Zesty implements multi-layered defense-in-depth security across authentication, authorization, data persistence, and HTTP communications.

---

## 1. Core Security Features

- **HTTP Security Headers (`helmet`)**: Configured with strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS - 1 year preload), Frameguard (`DENY`), and Referrer Policy.
- **Anti-NoSQL Injection (`customMongoSanitize`)**: In-place recursive sanitizer that strips `$` prefix keys and `.` dot notation from `req.body`, `req.params`, and `req.query`.
- **HTTP Parameter Pollution (`hpp`)**: Middleware protection preventing array-based parameter pollution attacks.
- **Cookie Security**: Authentication sessions use signed, HttpOnly, SameSite-protected cookies (`zesty_session`).
- **Role Isolation & RBAC**: Strict portal authorization guards (`authFoodPartnerMiddleware`, `authDeliveryMiddleware`, `authAdminMiddleware`) preventing portal cross-access.
- **Google OAuth Multi-Role Isolation**: Backend verifies intended portal role before authenticating Google OAuth credentials, preventing account impersonation across portals.

---

## 2. Secret Protection Policy

- **No Exposed Credentials**: Database URIs, passwords, JWT secrets, and OAuth keys are kept strictly in `.env` files.
- **Clean Logging Policy**: Terminal logging outputs only minimal status messages (`✅ MongoDB connected`, `🔐 User logged in`). Sensitive objects, tokens, and credentials are never printed to console logs.
