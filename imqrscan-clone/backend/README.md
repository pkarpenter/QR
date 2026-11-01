# IMQRScan Clone — Backend API Documentation

The backend is built with **FastAPI**, **Supabase (PostgreSQL + Auth)**, and **segno** for dynamic QR generation.

---

## 📡 API Reference Table

| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `GET` | `/health` | No | Service health check |
| `GET` | `/go/{slug}` | No (Public) | Heart of the system: resolves slug → checks `is_enabled` → 302 redirects to active link + logs scan in background |
| `GET` | `/api/qr` | Yes (JWT) | List all QR codes with active link title and total scan count |
| `POST` | `/api/qr` | Yes (JWT) | Create a new QR code with auto-generated 8-char slug |
| `GET` | `/api/qr/{id}` | Yes (JWT) | Get single QR code detail with active link and scan count |
| `PATCH` | `/api/qr/{id}` | Yes (JWT) | Rename QR code |
| `DELETE` | `/api/qr/{id}` | Yes (JWT) | Delete QR code and cascade-delete all its links and scans |
| `PATCH` | `/api/qr/{id}/toggle` | Yes (JWT) | Toggle QR code `is_enabled` flag (Enable / Disable) |
| `GET` | `/api/qr/{id}/image?format=png\|svg` | No | Generate & stream QR image with high error correction |
| `GET` | `/api/qr/{id}/download?fmt=png\|svg` | No | Download QR image as attachment |
| `GET` | `/api/qr/{id}/links` | Yes (JWT) | List all destination links for a QR code with 30-day scan counts |
| `POST` | `/api/qr/{id}/links` | Yes (JWT) | Add a destination link (validates `http/https`, rejects dangerous schemes) |
| `PUT` | `/api/links/{id}` | Yes (JWT) | Edit link title or destination URL |
| `DELETE` | `/api/links/{id}` | Yes (JWT) | Delete destination link |
| `POST` | `/api/qr/{id}/links/{lid}/activate` | Yes (JWT) | Atomically switch active destination link in a single DB transaction |
| `GET` | `/api/qr/{id}/analytics` | Yes (JWT) | Full analytics: KPIs, daily stacked timeline, devices, cities, hours |
| `GET` | `/api/qr/{id}/scans?limit=50` | Yes (JWT) | Live scan feed for a specific QR code |
| `GET` | `/api/qr/{id}/scans/export` | Yes (JWT) | Export all scan records as CSV file |
| `GET` | `/api/dashboard/stats` | Yes (JWT) | Aggregated KPIs across all QR codes for main dashboard |

---

## 🛡 Security & Design Principles

1. **HTTP 302 Found Redirect:** Never cached permanently by browsers (unlike 301), ensuring changes to the active link apply instantly.
2. **Background Task Logging:** `BackgroundTasks` records analytics without adding latency to the visitor redirect.
3. **GDPR-Safe IP Hashing:** Raw IPs are never stored; only `SHA-256(IP + IP_HASH_SALT)` is persisted.
4. **Rate Limiting:** Protects `/go/{slug}` from scan floods (60 requests/minute per client IP hash).
5. **Database Invariant:** Partial unique index `one_active_link_per_qr` enforces strictly at most one active link per QR code.
