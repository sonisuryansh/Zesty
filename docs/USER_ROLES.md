# User Roles & RBAC Matrix — Zesty Platform

Zesty enforces Role-Based Access Control (RBAC) to isolate user capabilities and prevent portal cross-access.

---

## 🎭 Defined User Roles

1. **Customer (`user`)**:
   - Capabilities: Browse feed, search dishes, build cart, place orders, save addresses, view order history.
   - Portal Access: Customer Portal (`/`).

2. **Restaurant Partner (`foodpartner`)**:
   - Capabilities: Upload food reels/photos, manage menu availability, process incoming kitchen orders, view financial earnings and monthly ledgers.
   - Portal Access: Partner Studio (`/studio`).

3. **Delivery Rider (`delivery`)**:
   - Capabilities: Toggle online/offline status, view available order delivery tasks, accept orders, update delivery milestones, view payout earnings.
   - Portal Access: Rider Workspace (`/delivery`).

4. **Super Admin (`admin`)**:
   - Capabilities: System audit logs, global settings, platform management.
   - Portal Access: Admin Control Panel (`/admin`).

---

## 🔒 RBAC Access Matrix

| Feature / Route | Customer (`user`) | Partner (`foodpartner`) | Rider (`delivery`) | Admin (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| Browse Food Feed & Reels | ✅ | ❌ | ❌ | ❌ |
| Create Food / Upload Reel | ❌ | ✅ | ❌ | ❌ |
| Manage Partner Menu & Delete | ❌ | ✅ | ❌ | ❌ |
| Add to Cart & Checkout | ✅ | ❌ | ❌ | ❌ |
| Accept & Deliver Orders | ❌ | ❌ | ✅ | ❌ |
| View System Audit Logs | ❌ | ❌ | ❌ | ✅ |
