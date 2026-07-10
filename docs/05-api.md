# API Documentation

- **Authentication:** Secure login, registration, JWT/session management
- **Promotion Requests:**
  - `POST /api/promotion-request` — Create new request
  - `GET /api/promotion-request` — List requests
  - `PATCH /api/promotion-request/:id` — Update request
- **Documents:**
  - `POST /api/document` — Upload document
  - `GET /api/document/:id` — Get document
  - `PATCH /api/document/:id/verify` — Verify document
- **Users:**
  - `POST /api/auth/register` — Register
  - `POST /api/auth/login` — Login

All endpoints require authentication and proper role.