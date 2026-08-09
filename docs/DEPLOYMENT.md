# Deployment & Production Architecture Guide — Zesty Platform

Guide for building and deploying Zesty to production environments (Vercel / Netlify for Frontend, Render / AWS EC2 for Backend, MongoDB Atlas for Database).

---

## 🚀 Build Instructions

1. **Frontend Production Build**:
   ```bash
   cd frontend
   npm run build
   ```
   Outputs static production bundle to `frontend/dist/`.

2. **Backend Production Execution**:
   ```bash
   cd backend
   npm start
   ```
   Runs Node.js server via `node server.js`.
