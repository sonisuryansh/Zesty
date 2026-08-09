# ⚙️ Environment Setup Guide — Zesty

Detailed breakdown of all `.env` files across `frontend` and `backend`.

---

## Backend `.env` Template
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/zesty
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret
COOKIE_SECRET=your_cookie_secret
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## Frontend `.env` Template
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```
