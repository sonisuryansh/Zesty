# Backend Google OAuth Verification — Zesty Server

Implementation details for Google credential verification in `src/controllers/auth.controller.js`.

---

## ⚡ Verification Protocol

```javascript
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.VITE_GOOGLE_CLIENT_ID,
});
const payload = ticket.getPayload();
```
Cross-checks requested portal role (`req.body.role`) against existing collections before creating or authenticating accounts.
