# Order Lifecycle Flow — Zesty Platform

This document details the order placement, state transitions, and real-time socket events across Customer, Restaurant, and Delivery Rider portals.

---

## 🔄 Order State Transitions

```text
[ Pending ] ──► [ Preparing ] ──► [ Ready for Pick Up ] ──► [ Out for Delivery ] ──► [ Delivered ]
```

1. **Order Creation (`POST /api/orders`)**:
   - Customer submits checkout form with address and payment method.
   - Status initialized to `Pending`.
   - Financial breakdown calculated automatically.
2. **Kitchen Processing (`PUT /api/orders/restaurant/:orderId/status`)**:
   - Restaurant Partner receives order notification in Partner Studio.
   - Updates status to `Preparing`, then `Ready for Pick Up`.
3. **Delivery Logistics (`PUT /api/delivery/orders/:orderId/status`)**:
   - Delivery Rider accepts available delivery task.
   - Status updated to `Out for Delivery`, then `Delivered`.
