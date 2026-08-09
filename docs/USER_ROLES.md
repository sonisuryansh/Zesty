# 👥 User Roles & Access Control Matrix — Zesty

Zesty implements Role-Based Access Control (RBAC) across four distinct roles:

---

## 🎭 Role Definitions

### 1. Customer (`user`)
- **Access Scope**: Public website, food reels feed, search, cart, checkout, profile, orders.
- **Model**: `userModel` ([user.model.js](file:///c:/Users/sonis/Desktop/Zesty/backend/src/models/user.model.js))
- **Auth Endpoint**: `/api/auth/login`, `/api/auth/register`, `/api/auth/google`

### 2. Restaurant Partner (`foodpartner`)
- **Access Scope**: Partner Studio dashboard, food reel upload, kitchen orders queue, store status toggle, earnings withdrawal.
- **Model**: `foodPartnerModel` ([foodpartner.model.js](file:///c:/Users/sonis/Desktop/Zesty/backend/src/models/foodpartner.model.js))
- **Auth Endpoint**: `/api/auth/foodpartner/login`, `/api/auth/foodpartner/register`, `/api/auth/google`

### 3. Delivery Rider (`delivery`)
- **Access Scope**: Rider Workspace dashboard, active delivery acceptance, delivery route distance, OTP delivery confirmation, rider payout settings.
- **Model**: `deliveryPartnerModel` ([deliveryPartner.model.js](file:///c:/Users/sonis/Desktop/Zesty/backend/src/models/deliveryPartner.model.js))
- **Auth Endpoint**: `/api/auth/delivery/login`, `/api/auth/delivery/register`, `/api/auth/google`

### 4. Super Admin (`admin`)
- **Access Scope**: Isolated path `/admin`, platform metrics, partner verification, user moderation.
- **Model**: `adminModel` ([admin.model.js](file:///c:/Users/sonis/Desktop/Zesty/backend/src/models/admin.model.js))
- **Auth Endpoint**: `/api/auth/admin/login` (Google OAuth disabled for admin)

---

## 🔒 Permission Matrix

| Feature / Action | Customer | Restaurant | Rider | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse Food Reels Feed | ✅ | ✅ | ✅ | ✅ |
| Add to Cart & Checkout | ✅ | ❌ | ❌ | ❌ |
| Upload Food Reel & Items | ❌ | ✅ | ❌ | ❌ |
| Accept & Prepare Orders | ❌ | ✅ | ❌ | ❌ |
| Pickup & Deliver Orders | ❌ | ❌ | ✅ | ❌ |
| Access Admin Panel (`/admin`)| ❌ | ❌ | ❌ | ✅ |
