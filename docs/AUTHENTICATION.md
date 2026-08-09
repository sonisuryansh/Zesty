# 🔒 Authentication & Session Management — Zesty

Zesty supports a dual authentication framework: Email + Password authentication and Google OAuth 2.0.

---

## 🔑 Session Token Architecture

1. **Access Token (`accessToken`)**:
   - Short-lived JWT containing `{ id, role }`.
   - Signed with `securityConfig.JWT.ACCESS_SECRET`.
   - Expiry: 15 minutes.
   - Stored in HttpOnly cookie `token`.

2. **Refresh Token (`refreshToken`)**:
   - Long-lived JWT containing `{ id, role }`.
   - Signed with `securityConfig.JWT.REFRESH_SECRET`.
   - Expiry: 7 days.
   - Stored in HttpOnly cookie `refreshToken` and saved in `sessions` collection.

---

## 📱 Multi-Device Session & Device Audit

When a user logs in, `session.service.js` calls `parseDeviceInfo(req)` in `device.utils.js`:
- Parses `user-agent` header into `browser`, `os`, `device`.
- Extracts client IP address (`x-forwarded-for` or `socket.remoteAddress`).
- Creates a new `Session` document storing `refreshToken`, device specs, and `lastActive` timestamp.
- Audits login events to `auditlogs` collection.
