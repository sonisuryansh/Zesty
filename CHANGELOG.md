# 📝 Changelog — Zesty Platform

All notable changes to the Zesty project are documented in this file.

---

## [2.1.0] - 2026-08-09

### 🚀 Added
- Multi-role Google OAuth 2.0 authentication with verified email account linking for Customers, Restaurant Partners, and Delivery Riders.
- Guest cart merge flow (`POST /api/cart/merge`) supporting single-restaurant conflict resolution (`409 Conflict`).
- Super Admin Control Panel isolated to route `/admin` with `authAdminMiddleware` enforcement.
- Socket.IO real-time delivery GPS location streaming engine.

### 🐛 Fixed
- Resolved `TypeError: Cannot set property query of #<IncomingMessage>` in Express 5 by replacing `express-mongo-sanitize` package with safe in-place `customMongoSanitize` middleware.
- Fixed `TypeError: useragent.parse is not a function` by instantiating `new useragent.UserAgent()` in `device.utils.js`.
- Fixed missing `phone` schema validation error on `deliveryPartnerModel` by setting `phone` to `sparse: true`.
- Removed hardcoded money fallback (`14850`) in `RestaurantDashboard.jsx`.
- Restored `SUGGESTED_CREATORS = []` array on homepage to eliminate React render crashes.

---

## [1.0.0] - 2026-08-01

### 🚀 Initial Release
- Core video reels food discovery feed.
- Email + password authentication system.
- Restaurant Partner studio dashboard.
- Delivery Rider workspace.
