# Auth Flow & Portal Modal Specifications — Zesty Frontend

Frontend authentication dialog, portal switching, and role isolation behavior.

---

## 🔐 Auth Modal Tabs

1. **Customer Tab**: Authenticates into `user` role.
2. **Restaurant Partner Tab**: Authenticates into `foodpartner` role.
3. **Delivery Rider Tab**: Authenticates into `delivery` role.

### Portal Role Isolation Guard
If a Restaurant Partner tries logging in on the Customer tab via Google OAuth, the backend returns HTTP 409 Conflict, and the modal renders:
> *"This Google account is registered as a Restaurant Partner. Switch to the Restaurant Partner tab."*
