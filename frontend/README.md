# ⚛️ Zesty Frontend — React 19 + Vite 8 Application

The frontend tier of Zesty is a single-page application built with React 19, Vite 8, and Vanilla CSS design tokens.

---

## 🚀 Quick Start

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`.

---

## 📦 Key Libraries & Dependencies

- `react` & `react-dom`: v19.0.0
- `vite`: v8.1.5
- `@react-oauth/google`: Google OAuth 2.0 Identity Services wrapper
- `@emailjs/browser`: Client-side direct email dispatch SDK
- `socket.io-client`: Real-time WebSocket event subscriber

---

## 🏛️ Component Architecture

- **`App.jsx`**: Main routing, layout canvas, navigation bar, modal manager, and state hub.
- **`App.css`**: Design system tokens, glassmorphism UI rules, dark/light themes, animations.
- **`components/`**: Modular component views (`ReelCard`, `RestaurantDashboard`, `DeliveryDashboard`, `SocialUserProfile`, `LocationModal`, `CartConflictModal`, `AdminControlPanel`).

---

## ⚡ Request Lifecycle Flow

```text
User Action ──► Event Handler ──► Local Component / App State ──► fetch() API Helper ──► Backend API ──► UI Re-render
```
