# Backend Authentication Engine — Zesty Server

Implementation details for JWT authentication, cookie management, and password hashing in `src/controllers/auth.controller.js`.

---

## 🔐 Auth Token Architecture

- **Token Generation**: `jwt.sign({ id, type, email }, process.env.JWT_SECRET, { expiresIn: '7d' })`.
- **Cookie Security**:
  ```javascript
  res.cookie('zesty_session', token, {
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
  ```
