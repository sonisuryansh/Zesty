# Role-Based Access Control (RBAC) — Zesty Backend

Role verification middleware functions defined in `src/middlewares/auth.middleware.js`.

---

## 🛡️ Role Guards

- `authUser`: Validates JWT token and attaches `req.user`.
- `authFoodPartnerMiddleware`: Validates `req.user.type === 'foodpartner'` and attaches `req.foodPartner`.
- `authDeliveryMiddleware`: Validates `req.user.type === 'delivery'` and attaches `req.deliveryPartner`.
- `authAdminMiddleware`: Validates `req.user.type === 'admin'` and attaches `req.admin`.
