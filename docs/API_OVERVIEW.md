# 📡 API Overview & Route Registry — Zesty

Zesty exposes RESTful API endpoints mounted under `/api`.

---

## 🚦 API Modules Summary

| Base Path | Module Purpose | Guard Middleware |
| :--- | :--- | :--- |
| `/api/auth` | Login, Register, Google OAuth, Session check, Logout | Optional / `authUserMiddleware` |
| `/api/food` | Food reels feed, Upload reel, Restaurant food search | `authFoodPartnerMiddleware` for upload/delete |
| `/api/restaurants` | Restaurant partner public profiles & availability | Public |
| `/api/cart` | Cart query, Add item, Guest cart merge, Quantity update, Clear | `authUserMiddleware` |
| `/api/orders` | Order creation, Active orders, Status updates, OTP verification | `authUserMiddleware` / `authPartner` / `authDelivery` |
| `/api/address` | Customer saved address management | `authUserMiddleware` |
| `/api/delivery` | Rider active orders, Distance, Duty toggle, Earnings | `authDeliveryPartnerMiddleware` |
| `/api/users` | User profile updates & customer orders | `authUserMiddleware` |
| `/api/admin` | Isolated Super Admin platform control panel | `authAdminMiddleware` |
