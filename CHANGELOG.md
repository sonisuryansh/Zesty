# Changelog — Zesty Platform

All notable changes, bug fixes, and system improvements to the Zesty project are documented in this file.

## [1.4.0] - 2026-08-09
### Added
- **Live ImageKit Integration**: Verified and mounted live ImageKit credentials (`private_NW23hoVm...`) in `backend/.env` for direct Cloud CDN media uploads.
- **Nodemon Watcher Optimization**: Added `backend/nodemon.json` ignoring `public/uploads/*` to prevent mid-upload server restarts.
- **Protected Partner Endpoint**: Created `GET /api/food/my-items` allowing restaurant partners to fetch 100% of their published food items independently of client state.
- **Null-Safe Financial Aggregation**: Added `{ $ifNull: ['$pricing.subtotal', 0] }` in `restaurant.controller.js` to eliminate HTTP 500 errors in monthly earnings ledger calculations.

### Fixed
- **Google OAuth Multi-Role Isolation**: Resolved HTTP 400/409 errors by enforcing portal verification (`role` check) before authenticating Google credentials.
- **Intact Media Storage Engine**: Replaced base64 binary buffer truncation (`.subarray()`) with intact file storage in `/public/uploads/` to eliminate corrupted MP4 video files.
- **Vite Proxy Media Routing**: Added `/uploads` proxy route in `frontend/vite.config.js` to ensure static media files stream smoothly without 502/404 errors.
- **Partner Studio UI Grid**: Added responsive `.studio-grid` and fixed `.studio-thumb` CSS dimensions (280px height) to prevent 4K videos from expanding on 100% browser zoom.
- **Permanent Food Deletion**: Updated `handleDeleteFood` in `RestaurantDashboard.jsx` to issue HTTP `DELETE /api/food/:id` to MongoDB Atlas instead of only mutating local React state.

## [1.3.0] - 2026-08-08
### Added
- Cart conflict detection modal for multi-restaurant cart additions.
- Customer location modal with OpenStreetMap reverse geolocation.
- Instagram story-style category circles filter bar in main feed.

## [1.0.0] - 2026-08-01
- Initial production release of Zesty full-stack platform.
