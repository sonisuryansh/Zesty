# Backend Documentation — Zesty Application

The Zesty backend engine is built with **Node.js**, **Express 5**, **Mongoose**, **Socket.io**, and **MongoDB Atlas**.

---

## 🚀 Overview & Key Systems

- **Express 5 REST API**: 9 modular router modules handling Auth, Food, Restaurants, Orders, Delivery, Cart, Addresses, Admin, Users.
- **Hybrid Media Engine**: ImageKit Cloud CDN integration with local `/public/uploads/` intact media fallback.
- **Security Chain**: Helmet, CORS, signed HttpOnly cookies, custom Mongo sanitize, HPP parameter protection.
- **Role Isolation**: Strict middleware guards (`authFoodPartnerMiddleware`, `authDeliveryMiddleware`, `authAdminMiddleware`).

---

## 📁 Directory Structure

```text
backend/
├── server.js             # HTTP & Socket.io server entry point
├── nodemon.json          # Watcher ignore rules (ignores public/uploads/*)
├── public/uploads/       # Local intact media files
├── src/
│   ├── app.js            # Express app configuration & middleware
│   ├── config/           # Security configuration
│   ├── controllers/      # Route controllers (auth, food, order, etc.)
│   ├── db/               # MongoDB Mongoose connection driver
│   ├── middlewares/      # JWT, RBAC guards
│   ├── models/           # 15 Mongoose schemas
│   ├── routes/           # Express router endpoints
│   ├── services/         # Storage service (ImageKit / Local)
│   └── utils/            # OTP, Email, Device helpers
└── docs/                 # Backend specifications & API docs
```

---

## 📖 Backend Documentation Index

- 📖 **[Architecture & Pipeline](docs/ARCHITECTURE.md)**
- 📖 **[API Endpoints Reference](docs/API.md)**
- 📖 **[Database Models & Schemas](docs/DATABASE_MODELS.md)**
- 📖 **[Authentication Engine](docs/AUTHENTICATION.md)**
- 📖 **[Google OAuth Implementation](docs/GOOGLE_OAUTH.md)**
- 📖 **[Role-Based Access Control (RBAC)](docs/RBAC.md)**
- 📖 **[Services Specification](docs/SERVICES.md)**
- 📖 **[Middleware Chain](docs/MIDDLEWARE.md)**
- 📖 **[Session Management](docs/SESSIONS.md)**
- 📖 **[Error Handling & Logging](docs/ERROR_HANDLING.md)**
- 📖 **[Backend Setup Guide](docs/SETUP.md)**
