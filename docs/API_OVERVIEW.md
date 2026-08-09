# API Overview & Route Specifications — Zesty Platform

Global index of RESTful API endpoints mounted on Express 5 backend server.

---

## 📌 Route Modules Index

### 1. Authentication Routes (`/api/auth`)
- `POST /api/auth/register` — Register new user account.
- `POST /api/auth/login` — Login user.
- `POST /api/auth/google` — Google OAuth authentication.
- `GET /api/auth/me` — Fetch current user session.
- `POST /api/auth/logout` — Logout user.

### 2. Food & Reel Routes (`/api/food`)
- `POST /api/food` — Upload food item/reel (Protected: FoodPartner).
- `GET /api/food` — Get all available food items (Public).
- `GET /api/food/my-items` — Get partner's published food items (Protected: FoodPartner).
- `GET /api/food/restaurant/:restaurantId` — Get items by restaurant ID.
- `DELETE /api/food/:id` — Delete food item & reel (Protected: FoodPartner).

### 3. Restaurant Partner Routes (`/api/restaurants`)
- `GET /api/restaurants` — Get all restaurants.
- `GET /api/restaurants/:id` — Get restaurant profile.
- `PUT /api/restaurants/status` — Toggle online/offline status (Protected: FoodPartner).
- `GET /api/restaurants/dashboard/stats` — Get partner stats (Protected: FoodPartner).
- `GET /api/restaurants/financials` — Monthly financial ledger (Protected: FoodPartner).

### 4. Order System Routes (`/api/orders`)
- `POST /api/orders` — Create new food order (Protected: Customer).
- `GET /api/orders/my-orders` — Customer order history (Protected: Customer).
- `GET /api/orders/restaurant/incoming` — Kitchen orders (Protected: FoodPartner).
- `PUT /api/orders/restaurant/:orderId/status` — Update order status (Protected: FoodPartner).

### 5. Cart Routes (`/api/cart`)
- `GET /api/cart` — Get active user cart.
- `POST /api/cart/add` — Add item to cart.
- `POST /api/cart/update` — Update item quantity.
- `POST /api/cart/clear` — Clear cart.
- `POST /api/cart/merge` — Merge guest cart into user cart.
