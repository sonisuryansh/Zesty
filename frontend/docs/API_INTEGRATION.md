# API Integration & Fetch Layer — Zesty Frontend

Details of the `safeFetchJson` helper utility and request processing layer.

---

## 🛠️ `safeFetchJson` Helper Specs

```javascript
async function safeFetchJson(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  }
  // Sends request through Vite proxy (/api or /uploads)
}
```
Includes HttpOnly session credentials on all requests.
