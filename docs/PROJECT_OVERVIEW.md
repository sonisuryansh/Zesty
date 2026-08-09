# Project Overview — Zesty Platform

Zesty is a full-stack, video-first food discovery and instant delivery platform designed to connect hungry customers with local culinary creators and fast delivery riders.

---

## 🎯 Executive Summary & Mission

Traditional food delivery platforms rely on static text menus and stock photos. Zesty revolutionizes food discovery by bringing short video reels created directly by local restaurant partners to the front page of food delivery. Customers watch real food preparation, explore interactive menus, add items to cart, and track order fulfillment in real-time.

---

## 🔑 Core Features & System Modules

1. **Reel-Based Food Feed**: Scrollable video feed of dishes uploaded by verified local restaurant partners.
2. **Multi-Portal Architecture**:
   - **Customer Portal**: Browse reels, search dishes, manage cart, place orders, track live status.
   - **Restaurant Partner Studio**: Upload video reels/photos, manage menu availability, process kitchen orders, track monthly financial earnings.
   - **Delivery Rider Workspace**: Accept available delivery tasks, view pickup/dropoff navigation details, track completed deliveries and payouts.
   - **Super Admin Dashboard**: System audit logs, platform settings, user management.
3. **Cart & Guest Checkout Engine**: Unauthenticated guest cart persisted in `localStorage` that seamlessly merges into the database upon login.
4. **Transparent Financial Ledger**: Automatic calculation of food subtotals, packaging charges (₹20), GST tax (5%), delivery fees (₹40), platform commission (5%), and partner earnings.
