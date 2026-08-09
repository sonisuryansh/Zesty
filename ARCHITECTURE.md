# 🏗️ System Architecture — Zesty Platform

Zesty is engineered as a decoupled, multi-role web application powered by a Node.js / Express 5 API backend, MongoDB datastore, and a React 19 single-page client built with Vite 8.

---

## 🏛️ High-Level System Architecture

```text
+-----------------------------------------------------------------------+
|                           CLIENT TIER                                 |
|  +-----------------------------------------------------------------+  |
|  |                     React 19 SPA (Vite 8)                       |  |
|  |  - Stateful Navigation & View Router (feed, studio, delivery)     |  |
|  |  - Modular Component Library (ReelCard, Dashboards, Modals)      |  |
|  |  - @react-oauth/google OAuth Client                              |  |
|  |  - Socket.IO Real-Time Client                                    |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------┬-----------------------------------+
                                    | HTTP REST / WebSockets
                                    ▼
+-----------------------------------------------------------------------+
|                           API SERVER TIER                             |
|  +-----------------------------------------------------------------+  |
|  |                     Express 5 Application                       |  |
|  |  - Security: Helmet CSP, CORS, HPP, Custom In-Place Anti-NoSQL    |  |
|  |  - Authentication: Jwt Cookie Session Engine                       |  |
|  |  - RBAC Guard: authUserMiddleware, authPartner, authAdmin         |  |
|  +-----------------------------------------------------------------+  |
|  +-----------------------------------------------------------------+  |
|  |                     Controller Domain Layer                     |  |
|  |  - Auth (login, signup, google, me, logout)                       |  |
|  |  - Food (reels feed, upload, restaurant search)                   |  |
|  |  - Cart (guest merge, conflict resolution, item update)           |  |
|  |  - Order (creation, status update, live GPS stream)              |  |
|  |  - Admin (platform metrics, user management)                       |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------┬-----------------------------------+
                                    | Mongoose 9 ODM
                                    ▼
+-----------------------------------------------------------------------+
|                          DATABASE TIER                                |
|  +-----------------------------------------------------------------+  |
|  |                          MongoDB                                |  |
|  |  - Collections: users, foodpartners, deliverypartners, foods,    |  |
|  |                 carts, orders, sessions, auditlogs, addresses     |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

---

## 🔒 Security Architecture

1. **Helmet & Security Headers**: Enforces strict Content Security Policy (`scriptSrc`, `styleSrc`, `imgSrc`), HSTS (1 year max age), XSS filters, and iframe clickjacking protection.
2. **CORS & Origin Validation**: Restricts credentials-mode requests to `http://localhost:5173`.
3. **Safe In-Place Anti-NoSQL Sanitization**: Mutates input keys on `req.body`, `req.params`, and `req.query` without breaking Express 5 read-only getters.
4. **JWT Authentication & HttpOnly Cookies**: Token payload signed with HMAC-SHA256 and stored in HttpOnly, SameSite cookies.
5. **Role Isolation**: Strictly segregates access between Customer, Food Partner, Delivery Rider, and Super Admin roles. Super Admin access is isolated to `/admin` routes and guarded by `authAdminMiddleware`.
