# State Management Architecture — Zesty Frontend

State management specifications across React 19 component trees and local storage persistence.

---

## 💾 Core States in `App.jsx`

- `session`: User identity object (`{ id, name, email, type, profile }`) fetched on load via `GET /api/auth/me`.
- `foods`: Global array of available food items fetched from `GET /api/food`.
- `cart`: Active shopping cart containing items array, subtotal, and foodPartner reference.
- `addresses`: Saved customer delivery addresses.
- `themeMode`: UI color theme (`dark` / `light`), persisted in `localStorage.zesty_theme`.
- `zesty_guest_cart`: Unauthenticated guest cart persisted in `localStorage`.
