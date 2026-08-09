# Frontend Documentation — Zesty Application

The Zesty frontend is a video-first food discovery Single Page Application (SPA) built using **React 19**, **Vite**, and **Vanilla CSS**.

---

## 🚀 Overview & Capabilities

- **Instagram-Style Reels Feed**: Vertical scrollable food feed with video autoplay (`ReelCard.jsx`).
- **Partner Studio Dashboard**: Food item creation, image/video reel uploads, menu availability management, delete operations, and monthly financial ledger (`RestaurantDashboard.jsx`).
- **Rider Workspace**: Active delivery job management, pickup/dropoff map links, order status updates (`DeliveryDashboard.jsx`).
- **Customer Portal**: Guest cart, single-restaurant cart conflict protection, address management, and checkout (`App.jsx`).

---

## 📁 Directory Structure

```text
frontend/
├── vite.config.js      # Vite dev server and proxy configuration (/api, /uploads)
├── index.html          # HTML5 entry template
├── src/
│   ├── main.jsx        # React root entry point
│   ├── App.jsx         # Main application container & view router
│   ├── App.css         # Global CSS design system & component styles
│   └── components/     # Modals, cards, feeds, dashboards
└── docs/               # Frontend specifications & guides
```

---

## 📖 Frontend Documentation Index

- 📖 **[Architecture & Setup](docs/ARCHITECTURE.md)**
- 📖 **[Component Library Index](docs/COMPONENTS.md)**
- 📖 **[View Routing Engine](docs/ROUTING.md)**
- 📖 **[State Management Strategy](docs/STATE_MANAGEMENT.md)**
- 📖 **[Authentication & RBAC UI](docs/AUTH_FLOW.md)**
- 📖 **[API Integration & Fetch Layer](docs/API_INTEGRATION.md)**
- 📖 **[Google OAuth Integration](docs/GOOGLE_OAUTH.md)**
- 📖 **[Setup & Development Guide](docs/SETUP.md)**
