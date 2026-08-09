# 🛒 Cart & Guest Cart Merge Flow — Zesty

Zesty provides a guest cart feature allowing unauthenticated visitors to add items before signing in.

---

## ⚡ Guest Cart Architecture & Merge Process

1. **Guest Cart State**: Unauthenticated items saved to `localStorage` key `zesty_guest_cart`.
2. **Post-Authentication Merge**: Upon logging in via Email or Google OAuth, frontend invokes `POST /api/cart/merge` with `items` array.
3. **Backend Validation & ObjectId Filtering**: Backend filters items with `mongoose.isValidObjectId(id)` to prevent CastError crashes.
4. **Single Restaurant Rule (`409 Conflict`)**: If existing account cart contains items from Restaurant A, and guest cart has items from Restaurant B, backend returns `409 Conflict` prompting user to replace or keep cart.
5. **Subtotal Recalculation & Local Cleanup**: Subtotal is recalculated on server, and `zesty_guest_cart` is cleared from `localStorage` only after HTTP 200 confirmation.
