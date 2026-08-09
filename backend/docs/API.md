# Backend API Endpoints Reference — Zesty Backend

Comprehensive specification of all RESTful routes implemented in `src/routes/`.

---

## 📌 Endpoint Specifications

### Auth Routes (`src/routes/auth.routes.js`)
- `POST /api/auth/register` — Body: `{ name, email, password, phone, role }` -> `201 Created`
- `POST /api/auth/login` — Body: `{ email, password, role }` -> `200 OK`
- `POST /api/auth/google` — Body: `{ credential, role }` -> `200 OK` or `409 Conflict`
- `GET /api/auth/me` — Headers/Cookie: Signed session -> `200 OK` (User profile)
- `POST /api/auth/logout` — Clears `zesty_session` cookie -> `200 OK`

### Food Routes (`src/routes/food.routes.js`)
- `POST /api/food` — Multipart Form: `{ name, price, category, video }` (Protected: `foodpartner`) -> `201 Created`
- `GET /api/food` — Public available food items feed -> `200 OK`
- `GET /api/food/my-items` — Partner published food items (Protected: `foodpartner`) -> `200 OK`
- `DELETE /api/food/:id` — Deletes food document from MongoDB (Protected: `foodpartner`) -> `200 OK`

### Restaurant Routes (`src/routes/restaurant.routes.js`)
- `GET /api/restaurants` — Public list of all restaurants -> `200 OK`
- `GET /api/restaurants/:id` — Restaurant details -> `200 OK`
- `PUT /api/restaurants/status` — Body: `{ isOnline }` (Protected: `foodpartner`) -> `200 OK`
- `GET /api/restaurants/dashboard/stats` — Partner dashboard metrics -> `200 OK`
- `GET /api/restaurants/financials` — Query: `month=YYYY-MM` (Protected: `foodpartner`) -> `200 OK`

### Order Routes (`src/routes/order.routes.js`)
- `POST /api/orders` — Body: `{ items, deliveryAddress, paymentMethod }` -> `201 Created`
- `GET /api/orders/my-orders` — Customer order history -> `200 OK`
- `GET /api/orders/restaurant/incoming` — Kitchen incoming orders -> `200 OK`
- `PUT /api/orders/restaurant/:orderId/status` — Body: `{ status }` -> `200 OK`
