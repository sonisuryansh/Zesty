# 🍕 Zesty - Enterprise Security & Reel-Based Food Platform

**Zesty** is a full-stack, video-first food discovery and ordering platform powered by short-form video reels, multi-role authentication, real-time Socket.IO tracking, and production-grade security infrastructure.

---

## ✨ Enterprise Security Features

### 🔐 1. Authentication Infrastructure
- **Google OAuth 2.0**: Native login/signup with `@react-oauth/google` and `google-auth-library`. Automatic account linking for existing email profiles across Customers, Food Partners, and Delivery Partners.
- **Phone OTP Authentication (MSG91)**: SMS OTP dispatch with 5-minute expiry, hashed OTP storage, 60-second resend cooldown, and a maximum of 5 verification attempts.
- **Email Verification & Reset**: Verification tokens for new accounts and unified forgot password flows supporting both Email and Phone OTP.
- **Refresh Token Rotation**: Short-lived Access Tokens (15 mins) paired with HTTP-Only Refresh Tokens (30 days) and active session invalidation.

### 🛡️ 2. Defense-in-Depth & Hardening
- **Helmet Headers**: Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), Frameguard (Clickjacking prevention), XSS Filter, and Referrer Policy.
- **NoSQL Injection & HPP Prevention**: `express-mongo-sanitize` strips operator keys (`$`, `.`) from request payloads; `hpp` prevents HTTP parameter pollution.
- **Strict CORS & Signed Cookies**: Configured domain whitelisting with credentials support and signed HTTP-only cookies.
- **Granular Rate Limiting**: Dedicated rate limiters for Login (5/15m), OTP (5/10m), Signup (5/1h), and Forgot Password (3/1h).
- **Account Lockout & Failed Attempt Counter**: Automatic 30-minute lock after 5 consecutive failed login attempts.
- **Audit Logging**: Comprehensive MongoDB security logs capturing Action, Performer, Role, IP Address, Browser, OS, and Device details.
- **Authenticated Socket.IO**: JWT-validated real-time WebSockets with role-based rooms.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, `@react-oauth/google`, Socket.IO Client, Lucide Icons, Vanilla CSS3 |
| **Backend** | Node.js, Express.js 5, MongoDB & Mongoose 9, JWT, BcryptJS (12 rounds) |
| **Security & Auth** | Google Auth Library, MSG91 SMS API, Nodemailer, Express Validator, Helmet, Mongo Sanitize, HPP |
| **Media CDN** | ImageKit.io Node SDK, Multer in-memory upload |

---

## 🌐 API Security Reference

### 🔑 Authentication (`/api/auth`)
- `POST /api/auth/user/register` - Customer registration with email verification
- `POST /api/auth/user/login` - Customer email/password authentication
- `GET  /api/auth/user/logout` - Revoke current session
- `POST /api/auth/google` - Unified Google OAuth endpoint for all roles
- `POST /api/auth/send-otp` - Dispatch Phone OTP via MSG91
- `POST /api/auth/verify-otp` - Verify Phone OTP
- `POST /api/auth/login-phone` - Login/Signup using Phone OTP
- `POST /api/auth/forgot-password/send` - Send reset code (Email or Phone)
- `POST /api/auth/forgot-password/verify` - Reset password with verified code
- `POST /api/auth/refresh` - Refresh access token using HTTP-only refresh cookie
- `GET  /api/auth/sessions` - List all active device sessions
- `POST /api/auth/logout-others` - Terminate session on all other devices
- `POST /api/auth/logout-all` - Terminate sessions on all devices
- `GET  /api/auth/me` - Session verification & profile retrieval

---

## ⚙️ Environment Configuration (`.env`)

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/zesty
JWT_SECRET=zesty_super_secret_jwt_key_2026
REFRESH_TOKEN_SECRET=zesty_super_secret_refresh_key_2026
COOKIE_SECRET=zesty_cookie_secret_signed_2026
CLIENT_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MSG91 SMS OTP
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_msg91_template_id

# SMTP Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ImageKit
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/zesty
```

---

## 🚀 Quick Start

1. **Backend Server**:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend Client**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
