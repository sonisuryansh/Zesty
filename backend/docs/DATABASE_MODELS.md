# 🗄️ Mongoose Models & Schemas — Zesty Backend

Detailed inventory of all 15 Mongoose schemas in `src/models/`.

---

## 📋 Schema Definitions

### 1. `user.model.js` (`userModel`)
- **Collection**: `users`
- **Fields**: `fullName`, `name`, `email` (required, unique), `phone`, `password`, `googleId` (sparse), `avatar`, `profilePicture`, `isEmailVerified` (boolean).

### 2. `foodpartner.model.js` (`foodPartnerModel`)
- **Collection**: `foodpartners`
- **Fields**: `name` (required), `email` (required, unique), `password`, `phone` (sparse), `googleId` (sparse), `avatar`, `approvalStatus` (`pending`, `approved`, `rejected`), `isOnline` (boolean), `rating`, `location`.

### 3. `deliveryPartner.model.js` (`deliveryPartnerModel`)
- **Collection**: `deliverypartners`
- **Fields**: `name` (required), `email` (required, unique), `phone` (sparse), `googleId` (sparse), `approvalStatus` (`pending`, `approved`), `dutyStatus` (`offline`, `online`, `busy`), `completedDeliveries`, `earnings`.

### 4. `food.model.js` (`foodModel`)
- **Collection**: `foods`
- **Fields**: `name` (required), `description`, `price` (number), `category`, `video` (string URL), `videoFileId`, `isAvailable` (boolean), `foodPartner` (ref: `foodpartner`).

### 5. `cart.model.js` (`cartModel`)
- **Collection**: `carts`
- **Fields**: `user` (ref: `user`), `foodPartner` (ref: `foodpartner`), `items` (`[{ food, name, price, quantity, instructions }]`), `subtotal`.

### 6. `order.model.js` (`orderModel`)
- **Collection**: `orders`
- **Fields**: `user` (ref: `user`), `foodPartner` (ref: `foodpartner`), `deliveryPartner` (ref: `DeliveryPartner`), `items`, `totalAmount`, `status` (`Placed`, `Accepted`, `Preparing`, `Ready`, `Out for Delivery`, `Delivered`), `deliveryOTP`.
