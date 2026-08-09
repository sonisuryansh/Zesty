# Environment Setup Reference — Zesty Platform

Reference guide for environment variables required across backend and frontend services.

---

## 🔑 Backend Variables (`backend/.env`)

| Variable Name | Required | Purpose | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | HTTP server listening port | `3000` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens | `zesty_jwt_secret_key` |
| `COOKIE_SECRET` | Yes | Secret key for signing cookies | `zesty_cookie_secret` |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID | `xxx.apps.googleusercontent.com` |
| `IMAGEKIT_PRIVATE_KEY` | Optional | ImageKit Cloud API Private Key | `private_xxxxxx` |
| `IMAGEKIT_PUBLIC_KEY` | Optional | ImageKit Cloud API Public Key | `public_xxxxxx` |
| `IMAGEKIT_URL_ENDPOINT` | Optional | ImageKit Cloud CDN URL Endpoint | `https://ik.imagekit.io/xxxx` |

---

## 🎨 Frontend Variables (`frontend/.env`)

| Variable Name | Required | Purpose | Example |
| :--- | :---: | :--- | :--- |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID | `xxx.apps.googleusercontent.com` |
| `VITE_API_URL` | Yes | Relative API base URL | `/api` |
