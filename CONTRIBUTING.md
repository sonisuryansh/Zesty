# Contributing Guidelines — Zesty Platform

Thank you for contributing to Zesty! Please follow these guidelines to maintain high code quality and architectural integrity.

---

## 1. Development Principles

1. **Source of Truth**: The active codebase is the ultimate authority. Always inspect live routes, controllers, and models before making changes.
2. **Zero Dummy Data in Production**: Never commit hardcoded fallback arrays or sample video URLs to production logic. All data must come from MongoDB Atlas or verified user uploads.
3. **No Binary Truncation**: When handling media files, preserve binary headers intact. Never truncate video buffers using `.subarray()` or raw slicing.
4. **Clean Logging**: Maintain minimal, professional terminal logging (`✅ MongoDB connected`, `🚀 Server running`). Never log secrets, passwords, or full DB URIs.

---

## 2. Local Setup & Testing Workflow

1. Clone the repository and install dependencies in both `backend` and `frontend`:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Set up `.env` files following `.env.example` in both directories.
3. Start development servers:
   - Backend: `npm run dev` in `backend/` (Port 3000)
   - Frontend: `npm run dev` in `frontend/` (Port 5173)
4. Verify production build before committing:
   ```bash
   cd frontend && npm run build
   ```

---

## 3. Pull Request Standards

- Ensure all new API endpoints are documented in `docs/API_OVERVIEW.md` and `backend/docs/API.md`.
- Test authentication flows across all three portal roles: Customer, Restaurant Partner, Delivery Rider.
- Verify media upload and page refresh persistence.
