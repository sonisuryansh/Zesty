# 🛡️ Security Policy — Zesty Platform

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `2.1.x` | Yes |
| `1.x` | No |

---

## Reporting Vulnerabilities

If you discover a security vulnerability within Zesty:
1. Please **do not** report it publicly on GitHub issues.
2. Send an email to `security@zesty.food` detailing the reproduction steps and proof of concept.
3. We will respond within 24 hours and issue a patch within 72 hours.

---

## Security Practices Implemented

- **Password Hashing**: Bcrypt with 10 salt rounds.
- **JWT Protection**: Stored exclusively in HttpOnly, SameSite cookies to mitigate XSS exposure.
- **NoSQL Injection Guard**: Custom recursive key sanitizer stripping `$` and `.` characters from input objects.
- **Admin Panel Isolation**: Public interface exposes no admin links or buttons; `/admin` routes are protected by role validation middleware.
