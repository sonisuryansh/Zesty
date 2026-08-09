# Backend Services Specification — Zesty Server

Implementation details for backend services in `src/services/`.

---

## 📦 Storage Service (`storage.services.js`)

- Integrates with `@imagekit/nodejs` SDK.
- If live keys are present, uploads file to ImageKit CDN (`/food-videos`).
- If unconfigured/test keys are present, writes intact binary buffer to `backend/public/uploads/` and returns public static path `/uploads/${fileName}`.
