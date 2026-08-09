# Backend Architecture — Zesty Server

Detailed specs of the Express 5 API server architecture, HTTP lifecycle, and database layer.

---

## 🏗️ Architecture Design

- **Server Entry**: `server.js` initializes `connectDB()`, mounts Express `app`, and creates Socket.io HTTP server listening on `process.env.PORT || 3000`.
- **Database Driver**: `src/db/db.js` connects via Mongoose to MongoDB Atlas. Outputs minimal `✅ MongoDB connected` log.
- **Static Asset Serving**: Express static middleware serves `backend/public/uploads` at `/uploads/*` for uncorrupted media streaming.
