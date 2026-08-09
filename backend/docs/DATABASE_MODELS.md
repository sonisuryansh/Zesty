# Database Models & Mongoose Schemas — Zesty Backend

Specifications for Mongoose models located in `src/models/`.

---

## 🗄️ Model Specifications

1. **`user.model.js`**: Customer user profiles with hashed passwords and phone numbers.
2. **`foodpartner.model.js`**: Restaurant profiles with online status, location coordinates, ratings, and packaging fee settings.
3. **`deliverypartner.model.js`**: Delivery rider profiles with vehicle info, online availability, and total earnings ledger.
4. **`food.model.js`**: Dish items with `mediaType` (`video`/`image`), `video`, `image`, `videoFileId`, and `foodPartner` ref.
5. **`order.model.js`**: Order records with items array, status enum, pricing breakdown, and financial ledger.
6. **`cart.model.js`**: Shopping cart schema referencing User and items array.
7. **`address.model.js`**: Customer saved addresses schema.
8. **`admin.model.js`**: Admin account schema.
9. **`auditLog.model.js`**: System security audit log schema.
