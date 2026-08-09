# 🔧 Troubleshooting Guide — Zesty

Common development errors and resolution steps.

---

## 1. MongoDB Documents Not Appearing in Atlas
- **Symptom**: Server prints `MongoDB is Connected`, but Atlas Dashboard shows `0` documents.
- **Cause**: Backend `.env` `MONGO_URI` is pointing to local MongoDB (`mongodb://localhost:27017/zesty`).
- **Fix**: Update `MONGO_URI` in `backend/.env` with your Atlas `mongodb+srv://...` string and restart `server.js`.

## 2. Google OAuth Origin Not Allowed (`[GSI_LOGGER]`)
- **Symptom**: Browser console logs `The given origin is not allowed for the given client ID`.
- **Fix**: Add `http://localhost:5173` to Authorized JavaScript Origins under your OAuth 2.0 Client ID in Google Cloud Console.

## 3. Cart Merge `409 Conflict`
- **Symptom**: User receives alert when logging in after adding guest cart items.
- **Cause**: User's account cart contains items from Restaurant A, while guest cart contains items from Restaurant B. Single-restaurant rule is enforced.
- **Fix**: User can choose to replace existing cart or keep current cart.
