# Cart & Guest Merge Specification — Zesty Platform

Zesty implements a persistent guest cart strategy that automatically merges into the authenticated user database cart upon sign-in.

---

## 🛒 Cart Workflow

1. **Guest Cart Browsing**:
   - Unauthenticated visitors add items to cart.
   - Saved locally in browser `localStorage` (`zesty_guest_cart`).
   - Supports quantity modification and single-restaurant cart guard.
2. **Cart Merge on Login**:
   - When guest logs in or registers, frontend calls `POST /api/cart/merge` passing the local guest cart array.
   - Backend merges item quantities into the user's database `Cart` document.
   - `localStorage` guest cart is cleared.
