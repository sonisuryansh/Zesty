# Architecture Deep-Dive — Zesty Platform

This document details the software architecture, system layers, networking, and request processing pipelines of Zesty.

---

## 1. System Layers

```text
[ React 19 SPA ] ──(Vite Proxy: /api & /uploads)──► [ Express 5 Server ] ──► [ MongoDB Atlas / ImageKit ]
```

### Layer Details
- **Frontend SPA**: Vite + React 19 single-page application using modern hooks, context state, and modal navigation.
- **Vite Proxy**: Dev proxy forwarding `/api` and `/uploads` to backend `http://127.0.0.1:3000`.
- **Backend API Engine**: Node.js + Express 5 application with security middleware, JWT authentication, and RESTful controllers.
- **Database**: MongoDB Atlas cloud cluster storing 15 Mongoose schemas.
- **Media Engine**: ImageKit Cloud API integration with automatic fallback to local `/public/uploads/` storage.

---

## 2. Request Processing Pipeline

1. **Client Request**: SPA sends request to `/api/...` or `/uploads/...`.
2. **Vite Proxy**: Forwards request to backend `http://127.0.0.1:3000`.
3. **Helmet & Security**: Enforces HTTP security headers, CORS origin verification, and HPP parameter protection.
4. **Cookie & Mongo Sanitizer**: Parses signed session cookie and strips Mongo query operators (`$` / `.`).
5. **Authentication Middleware**: Decodes JWT token and validates user session.
6. **Controller Handler**: Executes business logic, performs DB operations, returns JSON.
