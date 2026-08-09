# 🍕 Zesty — Video-First Food Discovery & Instant Delivery Platform

Zesty is a full-stack, multi-role food ordering and discovery platform that combines short-video food reels with real-time food delivery. Users discover fresh dishes through video reels created directly by cloud kitchens and local restaurants, order with a transparent 5% platform fee structure, track live delivery GPS updates via Socket.IO, and manage multi-role accounts across Customers, Restaurant Partners, Delivery Riders, and Super Admins.

---

## 🌟 Key Features by User Role

### 🍕 Customer
- **Short-Video Food Reel Feed**: Vertical video feed for discovering dishes with interactive likes, comments, and direct ordering.
- **Story Bar & Category Filters**: Horizontal story rings to filter food items by category (`All`, `Trending`, `Fast Food`, `Dessert`, `Healthy`, `Drinks`, `Spicy`).
- **Dual Authentication**: Sign in via Email/Password or **Continue with Google OAuth**.
- **Guest Cart & Cart Merge**: Temporary local guest cart allowing instant item addition before login, which automatically merges into the user's account cart upon authentication.
- **Single-Restaurant Cart Enforcement**: Interactive conflict detection prompting users when adding items from a second restaurant.
- **Location & Address Management**: GPS landmark selection modal supporting multiple delivery addresses (Home, Work, Other).
- **Direct Order & Inquiry Flow**: Cash-on-delivery checkout and direct EmailJS order inquiries sent directly to restaurant owners.
- **Real-Time Order Tracking**: Live GPS rider tracking with interactive step progress (`Placed`, `Accepted`, `Preparing`, `Out for Delivery`, `Delivered`).

### 🏪 Restaurant Partner (Partner Studio)
- **Partner Studio Dashboard**: Overview of total orders, pending kitchen queue, gross food sales, and net settled income.
- **Food Reel Upload**: Upload video reels and food items with title, specialty description, category, price, and media file via ImageKit storage integration.
- **Kitchen Order Management**: Real-time order acceptance, status updates (`Accepted`, `Preparing`, `Ready`), and delivery rider dispatch.
- **Store Availability Toggle**: 1-click Store Status switch (`ONLINE` / `OFFLINE`).
- **Payout & Payment Settings**: Bank account and UPI ID configuration for 5% commission settled revenue withdrawals.

### 🛵 Delivery Rider (Rider Workspace)
- **Rider Workspace Dashboard**: Active delivery assignments, pickup coordinates, customer delivery addresses, and distance calculation.
- **Duty Status Control**: 1-click duty toggle (`ONLINE` / `OFFLINE`).
- **Delivery Workflow & OTP Verification**: Accept orders, navigate to kitchen, input customer delivery OTP upon arrival to confirm drop-off.
- **Rider Earnings & Payouts**: 5% delivery commission tracking with UPI payout withdrawal request system.

### 🛡️ Super Admin Control Panel (Route `/admin`)
- **Strict Architecture Isolation**: Completely separated from public website views, guarded by `/admin` route and `authAdminMiddleware`.
- **Platform Analytics**: Total users, total partners, active riders, total revenue, and commission breakdown.
- **User & Partner Management**: View, approve, or ban platform accounts across all roles.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Vanilla CSS (Design Tokens & Glassmorphism), `@react-oauth/google`, `@emailjs/browser`, Socket.IO Client |
| **Backend** | Node.js, Express 5, Socket.IO, Mongoose 9, Google Auth Library (`google-auth-library`), `express-useragent`, `jsonwebtoken`, `cookie-parser`, `helmet`, `hpp` |
| **Database** | MongoDB Atlas / Local MongoDB (`zesty` database) |
| **Authentication** | Dual System: Email + Password (Bcrypt) & Google OAuth 2.0 with Verified Account Linking |
| **Storage & Email** | ImageKit Storage SDK, EmailJS SDK, Nodemailer SMTP |

---

## 📐 Project Architecture

```text
                               ┌─────────────────────────┐
                               │   Client Browser / UI   │
                               │   (React 19 + Vite 8)   │
                               └────────────┬────────────┘
                                            │ HTTP / WebSocket (Socket.IO)
                                            ▼
                               ┌─────────────────────────┐
                               │  Express 5 API Server   │
                               │      (Port 3000)        │
                               └────────────┬────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
┌─────────────────┐                ┌─────────────────┐                ┌─────────────────┐
│ Security & RBAC │                │  Core Services  │                │ External APIs   │
│ ├─ Helmet       │                │ ├─ Session Mgr  │                │ ├─ Google OAuth │
│ ├─ CORS / HPP   │                │ ├─ Device Audit │                │ ├─ ImageKit     │
│ └─ JWT / Admin  │                │ └─ Socket Engine│                │ └─ EmailJS      │
└────────┬────────┘                └────────┬────────┘                └────────┬────────┘
         │                                  │                                  │
         └──────────────────────────────────┼──────────────────────────────────┘
                                            │ Mongoose 9 ODM
                                            ▼
                               ┌─────────────────────────┐
                               │  MongoDB Database       │
                               │  (Atlas / Local zesty)  │
                               └─────────────────────────┘
```

---

## 📂 Project Structure

```text
Zesty/
├── README.md                          # Root Main Entry Point
├── ARCHITECTURE.md                    # Core System Architecture
├── CONTRIBUTING.md                    # Developer Guidelines
├── CHANGELOG.md                       # Release History
├── SECURITY.md                        # Security & Vulnerability Policy
├── docs/                              # Project Documentation Suite
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── USER_ROLES.md
│   ├── AUTHENTICATION.md
│   ├── GOOGLE_OAUTH.md
│   ├── API_OVERVIEW.md
│   ├── DATABASE.md
│   ├── ORDER_FLOW.md
│   ├── CART_FLOW.md
│   ├── PAYMENT_AND_COMMISSION.md
│   ├── DEPLOYMENT.md
│   ├── ENVIRONMENT_SETUP.md
│   └── TROUBLESHOOTING.md
├── frontend/                          # React Frontend Application
│   ├── README.md
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx                    # Main Layout, Navigation & Routes
│   │   ├── App.css                    # Design System & Token CSS
│   │   ├── main.jsx                   # React Root & GoogleOAuthProvider
│   │   └── components/                # Modular UI Components
│   └── docs/                          # Frontend Technical Docs
└── backend/                           # Node.js / Express API Server
    ├── README.md
    ├── server.js                      # HTTP & Socket.IO Engine Entry
    ├── package.json
    ├── src/
    │   ├── app.js                     # Express Middleware & Route Mounting
    │   ├── config/                    # Security & JWT Configuration
    │   ├── controllers/               # Auth, Food, Cart, Order Controllers
    │   ├── db/                        # Database Connection Handler
    │   ├── middlewares/               # Authentication & RBAC Middlewares
    │   ├── models/                    # Mongoose Schemas (User, Partner, Cart, etc.)
    │   ├── routes/                    # API Route Definitions
    │   ├── services/                  # Session & Audit Log Services
    │   └── utils/                     # Device Parser & OTP Utilities
    └── docs/                          # Backend Technical Docs
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB on port 27017 or MongoDB Atlas Cloud Cluster

### 2. Backend Setup
```bash
cd backend
npm install
```
Create `backend/.env`:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/zesty
JWT_SECRET=zesty_super_secret_jwt_key_2026
REFRESH_TOKEN_SECRET=zesty_super_secret_refresh_key_2026
COOKIE_SECRET=zesty_cookie_secret_signed_2026
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```
Start the backend server:
```bash
npx nodemon server.js
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```
Start Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Environment Variables Reference

| Variable Name | Required | Location | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | Backend | Express HTTP server port (Default: `3000`) |
| `MONGO_URI` | Yes | Backend | Connection URI for MongoDB Atlas or Local MongoDB |
| `JWT_SECRET` | Yes | Backend | Signing key for JWT access tokens |
| `REFRESH_TOKEN_SECRET` | Yes | Backend | Signing key for JWT refresh tokens |
| `COOKIE_SECRET` | Yes | Backend | Signing secret for signed cookies |
| `CLIENT_URL` | Yes | Backend | Frontend URL for CORS authorization (`http://localhost:5173`) |
| `GOOGLE_CLIENT_ID` | Yes | Both | OAuth Client ID from Google Cloud Console |
| `VITE_EMAILJS_SERVICE_ID` | Optional | Frontend | EmailJS Service ID for direct email orders |
| `VITE_EMAILJS_TEMPLATE_ID` | Optional | Frontend | EmailJS Template ID for direct email orders |
| `VITE_EMAILJS_PUBLIC_KEY` | Optional | Frontend | EmailJS Public API Key |

---

## 📚 Documentation Navigation

- 📖 **[System Architecture](file:///c:/Users/sonis/Desktop/Zesty/ARCHITECTURE.md)**
- 👥 **[User Roles & Permissions](file:///c:/Users/sonis/Desktop/Zesty/docs/USER_ROLES.md)**
- 🔒 **[Authentication & Sessions](file:///c:/Users/sonis/Desktop/Zesty/docs/AUTHENTICATION.md)**
- 🌐 **[Google OAuth Integration](file:///c:/Users/sonis/Desktop/Zesty/docs/GOOGLE_OAUTH.md)**
- 📡 **[API Reference Overview](file:///c:/Users/sonis/Desktop/Zesty/docs/API_OVERVIEW.md)**
- 🗄️ **[Database Schemas](file:///c:/Users/sonis/Desktop/Zesty/docs/DATABASE.md)**
- 🛒 **[Cart & Merge Flow](file:///c:/Users/sonis/Desktop/Zesty/docs/CART_FLOW.md)**
- 📦 **[Order & Delivery Lifecycle](file:///c:/Users/sonis/Desktop/Zesty/docs/ORDER_FLOW.md)**
- 💻 **[Frontend Documentation](file:///c:/Users/sonis/Desktop/Zesty/frontend/README.md)**
- ⚙️ **[Backend Documentation](file:///c:/Users/sonis/Desktop/Zesty/backend/README.md)**

---

## 🛡️ Security Policy & Troubleshooting

For security guidelines and vulnerability disclosures, refer to **[SECURITY.md](file:///c:/Users/sonis/Desktop/Zesty/SECURITY.md)**.
For common development issues and solutions, check **[TROUBLESHOOTING.md](file:///c:/Users/sonis/Desktop/Zesty/docs/TROUBLESHOOTING.md)**.
