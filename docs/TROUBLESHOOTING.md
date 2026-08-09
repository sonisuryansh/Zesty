# Troubleshooting Guide — Zesty Platform

Solutions for common development issues, proxy errors, media upload questions, and MongoDB connection troubleshooting.

---

## 🛠️ Common Issues & Fixes

### 1. `Vite proxy ECONNREFUSED` / `502 Bad Gateway`
- **Cause**: Node 18+ resolves `localhost` to IPv6 `::1` first on Windows, while Express listens on IPv4 `127.0.0.1:3000`.
- **Fix**: Verify `frontend/vite.config.js` sets target to `http://127.0.0.1:3000` for both `/api` and `/uploads` routes.

### 2. Video Upload Mid-Request Server Restart
- **Cause**: Nodemon watching all files in `backend/` and restarting when new files are saved to `public/uploads/`.
- **Fix**: Verify `backend/nodemon.json` contains `"ignore": ["public/uploads/*"]`.

### 3. Google OAuth `409 Conflict` (Role Mismatch)
- **Cause**: User clicked "Sign in with Google" on Customer portal using an account registered as a Restaurant Partner.
- **Fix**: Switch to the **Restaurant Partner** tab in the login modal and click "Sign in with Google".

### 4. Delete Button Only Removing Item from Memory
- **Cause**: `handleDeleteFood` not calling backend API.
- **Fix**: Verify `handleDeleteFood` in `RestaurantDashboard.jsx` executes `safeFetchJson('/api/food/:id', { method: 'DELETE' })`.
