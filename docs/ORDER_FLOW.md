# 📦 Order & Delivery Lifecycle — Zesty

Zesty implements an end-to-end order processing lifecycle connecting Customer, Restaurant Partner, and Delivery Rider via Socket.IO real-time events.

---

## 🔄 Order Lifecycle States

```text
Placed ──► Accepted ──► Preparing ──► Ready for Pickup ──► Out for Delivery ──► Delivered
```

1. **Order Creation (`Placed`)**: Customer places order via `/api/orders`. Emits `join_order_room`.
2. **Kitchen Acceptance (`Accepted` & `Preparing`)**: Restaurant Partner accepts order in Partner Studio and marks status.
3. **Rider Dispatch (`Out for Delivery`)**: Assigned Delivery Rider receives assignment details and navigation coordinates.
4. **OTP Drop-Off Confirmation (`Delivered`)**: Rider verifies customer OTP upon arrival at delivery location.
