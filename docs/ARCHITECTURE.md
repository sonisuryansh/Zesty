# 📐 System & Software Architecture — Zesty

Zesty is built on a 3-tier monolithic service architecture:

```text
┌─────────────────────────────────────────────────────────────┐
│                    REACT 19 FRONTEND                        │
│ ├─ Main App Router (App.jsx)                                │
│ ├─ View Managers: feed, studio, delivery, admin             │
│ └─ Socket.IO Realtime Subscriber                            │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXPRESS 5 BACKEND API                      │
│ ├─ App Security Middlewares (Helmet, CORS, NoSQL Sanitizer) │
│ ├─ Session & Audit Logging Engine                           │
│ ├─ Domain Controllers (Auth, Food, Cart, Order, Admin)      │
│ └─ Realtime Socket.IO Server Engine                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose 9 ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                         │
│ ├─ Collections: users, foodpartners, deliverypartners,      │
│ │               foods, carts, orders, sessions, auditlogs   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Subsystems

- **Auth & Session Service**: Signs JWTs, parses device User-Agent attributes, manages HttpOnly cookies, and logs IP & browser audit events.
- **Cart Engine**: Manages guest carts in `localStorage` and handles backend merging with ObjectId validation and single-restaurant conflict checks (`409 Conflict`).
- **Realtime Dispatch Engine**: Emits Socket.IO events (`update_live_location`, `order_status_changed`) to update live delivery maps.
