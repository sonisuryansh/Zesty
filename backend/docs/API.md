# 📡 API Endpoint Reference — Zesty Backend

Comprehensive specification of all RESTful API endpoints in `src/routes/`.

---

## 🔑 Authentication Routes (`/api/auth`)

### 1. Customer Login
- **Method**: `POST /api/auth/login`
- **Auth**: Public
- **Body**: `{ "email": "user@example.com", "password": "password123" }`
- **Response**: `200 OK` `{ "message": "Login successful", "user": { ... } }`

### 2. Google OAuth Login / Signup
- **Method**: `POST /api/auth/google`
- **Auth**: Public
- **Body**: `{ "idToken": "<google_jwt_credential>", "role": "user" | "foodpartner" | "delivery" }`
- **Response**: `200 OK` `{ "message": "Google OAuth authentication successful", "user": { ... } }`

### 3. Check Active Session
- **Method**: `GET /api/auth/me`
- **Auth**: Authenticated Cookie
- **Response**: `200 OK` `{ "id": "...", "email": "...", "type": "user" }`

---

## 🛒 Cart Routes (`/api/cart`)

### 1. Get Cart
- **Method**: `GET /api/cart`
- **Auth**: Required (`user`)
- **Response**: `200 OK` `{ "cart": { "items": [...], "subtotal": 299 } }`

### 2. Merge Guest Cart
- **Method**: `POST /api/cart/merge`
- **Auth**: Required (`user`)
- **Body**: `{ "items": [{ "foodId": "65...", "quantity": 1 }], "clearAndAdd": false }`
- **Response**: `200 OK` / `409 Conflict` (if restaurant mismatch)

---

## 📦 Order Routes (`/api/orders`)

### 1. Create Order
- **Method**: `POST /api/orders`
- **Auth**: Required (`user`)
- **Body**: `{ "deliveryAddress": { ... }, "paymentMethod": "COD" }`
- **Response**: `201 Created` `{ "message": "Order placed successfully", "order": { ... } }`

---

## 🛡️ Admin Routes (`/api/admin`)

### 1. Admin Platform Stats
- **Method**: `GET /api/admin/dashboard-stats`
- **Auth**: Super Admin (`authAdminMiddleware`)
- **Response**: `200 OK` `{ "stats": { "totalUsers": 12, "totalRevenue": 48500 } }`
