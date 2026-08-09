# Frontend Architecture — Zesty Application

High-level component hierarchy, reverse proxy contract, and rendering architecture of the Zesty React 19 SPA.

---

## 🏗️ Architecture Overview

- **Single Page Architecture**: Top-level view switching controlled via `currentView` state (`feed`, `reels`, `studio`, `delivery`, `admin`, `profile`, `orders`, `cart`).
- **Proxy Contract**: All `/api` and `/uploads` requests are proxied via `vite.config.js` to backend `http://127.0.0.1:3000`.
- **Media Player Engine**: Video elements in `ReelCard.jsx` and `RestaurantDashboard.jsx` use IntersectionObserver for automatic play/pause when scrolling.
