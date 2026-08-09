# Database Schema & Mongoose Models — Zesty Platform

Zesty utilizes MongoDB Atlas as its cloud database provider, configured via Mongoose ORM models.

---

## 📊 Entity Relationship Specs

```mermaid
erDiagram
    FoodPartner ||--o{ Food : publishes
    FoodPartner ||--o{ Order : receives
    User ||--o{ Order : places
    User ||--o1 Cart : owns
    User ||--o{ Address : saves
    DeliveryPartner ||--o{ Order : delivers
    Food ||--o{ CartItem : contains
```

---

## 🗄️ Core Mongoose Schemas

### 1. `User` Schema (`users`)
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, select: false)
- `googleId` (String)
- `phone` (String)

### 2. `FoodPartner` Schema (`foodpartners`)
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, select: false)
- `isOnline` (Boolean, default: true)
- `rating` (Number, default: 4.8)
- `location` ({ latitude: Number, longitude: Number, addressName: String })

### 3. `Food` Schema (`foods`)
- `name` (String, required)
- `description` (String)
- `price` (Number, required)
- `category` (String, default: 'Trending')
- `mediaType` (String, enum: ['video', 'image'], default: 'video')
- `video` (String, required)
- `image` (String)
- `foodPartner` (ObjectId -> FoodPartner, required)
- `isAvailable` (Boolean, default: true)

### 4. `Order` Schema (`orders`)
- `customer` (ObjectId -> User, required)
- `foodPartner` (ObjectId -> FoodPartner, required)
- `deliveryPartner` (ObjectId -> DeliveryPartner)
- `items` (Array of { food: ObjectId -> Food, name: String, quantity: Number, price: Number })
- `status` (String, enum: ['Pending', 'Preparing', 'Ready for Pick Up', 'Out for Delivery', 'Delivered', 'Cancelled'])
- `pricing` ({ subtotal: Number, packagingCharge: Number, gstTax: Number, deliveryFee: Number, grandTotal: Number })
- `financialBreakdown` ({ platformCommission: Number, restaurantEarnings: Number, deliveryFeePayout: Number })
