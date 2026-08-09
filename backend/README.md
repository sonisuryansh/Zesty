# ⚙️ Zesty Backend API — Node.js & Express 5 Application

The backend server for Zesty is built with Node.js, Express 5, Mongoose 9, Socket.IO, and Google Auth Library.

---

## 🚀 Quick Start

```bash
cd backend
npm install
cp .env.example .env
npx nodemon server.js
```

Backend API runs at `http://localhost:3000`.

---

## 🔄 HTTP Request Lifecycle

```text
HTTP Request
     │
     ▼
Express App (src/app.js)
     │
     ▼
Security Middlewares (Helmet, CORS, Custom In-Place Anti-NoSQL)
     │
     ▼
Authentication Middleware (authUserMiddleware / authPartner / authAdmin)
     │
     ▼
Router Module (src/routes/*.routes.js)
     │
     ▼
Controller Handler (src/controllers/*.controller.js)
     │
     ▼
Mongoose Model / Database Execution
     │
     ▼
HTTP JSON Response
```

---

## 📦 Key Middlewares & Security

- **`authUserMiddleware`**: Validates JWT access token in `token` HttpOnly cookie.
- **`authAdminMiddleware`**: Enforces `role === 'admin'` for Super Admin endpoints.
- **`customMongoSanitize`**: Safe recursive sanitizer stripping `$` and `.` characters from input objects in-place.
- **`hpp`**: Protects against HTTP Parameter Pollution attacks.
