# 🚀 Deployment Guide — Zesty

Zesty can be deployed to production using Node.js hosting environments (e.g. Render, Railway, AWS EC2, Vercel).

---

## 🛠️ Production Build Steps

### Frontend Build
```bash
cd frontend
npm run build
```
Generates production static bundle in `frontend/dist/`.

### Backend Production Server
```bash
cd backend
NODE_ENV=production node server.js
```
Ensure `CLIENT_URL` in `backend/.env` is updated to production domain for CORS security.
