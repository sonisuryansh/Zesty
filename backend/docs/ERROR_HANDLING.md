# Error Handling & Clean Logging — Zesty Backend

Error response structures and terminal logging policies.

---

## 📋 Error Standards

- `400 Bad Request`: Validation failure or missing input.
- `401 Unauthorized`: Invalid token or unauthenticated session.
- `403 Forbidden`: RBAC role permission denied.
- `404 Not Found`: Resource or user record not found.
- `409 Conflict`: Role mismatch or duplicate email.
- `500 Internal Server Error`: Server exception.

---

## 🪵 Clean Terminal Logging Policy
Outputs only minimal status indicators (`✅ MongoDB connected`, `🚀 Server running`). Credentials, secrets, and full database URIs are never printed.
