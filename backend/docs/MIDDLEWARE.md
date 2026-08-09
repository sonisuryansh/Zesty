# Middleware Chain — Zesty Backend

Execution order of global middleware registered in `src/app.js`.

---

## 🔗 Middleware Chain Order

1. `helmet()` — HTTP security headers.
2. `cors()` — Origin verification with credential support.
3. `express.static('/uploads')` — Intact media file streaming.
4. `cookieParser()` — Signed cookie parsing.
5. `express.json()` & `express.urlencoded()` — 50MB payload parsing.
6. `customMongoSanitize()` — Recursive NoSQL operator stripping.
7. `hpp()` — HTTP parameter pollution protection.
