# IMQRScan Clone — Dynamic QR Code Management System

A production-ready **Dynamic QR Code Management System** with real-time scan analytics, atomic destination switching, and full Supabase integration.

---

## 🏗 Architecture Overview

```
                          ┌────────────────────────┐
                          │   Visitor Smartphone   │
                          └───────────┬────────────┘
                                      │ Scans QR code
                                      ▼
                          ┌────────────────────────┐
                          │ GET /go/{slug}         │
                          │ (FastAPI Backend :8000)│
                          └─────┬────────────┬─────┘
           302 Found Redirect   │            │ Asynchronous background task
          Cache-Control: no-store            │
                                │            ▼
                                │    ┌────────────────────────┐
                                │    │ log_scan() Analytics   │
                                │    │ (User-Agent, GeoIP,    │
                                │    │  Salted SHA-256 IP)    │
                                │    └───────────┬────────────┘
                                ▼                │
                   ┌────────────────────────┐    │ Insert scan record
                   │ Destination Website    │    │ (bypasses RLS via service role)
                   │ (e.g. YouTube, Menu)   │    ▼
                   └────────────────────────┘ ┌────────────────────────┐
                                              │ Supabase PostgreSQL    │
                                              │ - qr_codes             │
                                              │ - links (partial index)│
                                              │ - scans                │
                                              └───────────▲────────────┘
                                                          │
                                     Admin API (JWT Auth) │
                                                          │
                                              ┌───────────┴────────────┐
                                              │ React Admin Dashboard  │
                                              │ (Vite + Recharts :5173)│
                                              └────────────────────────┘
```

---

## ⚡ Dynamic QR Code Flow

### 1. Visitor Journey (Scanning)
1. **Printed QR Code:** Encodes a permanent short URL on your domain (e.g., `https://qr.yourbrand.com/go/PXsyCXDe`). The physical QR code **never changes**.
2. **Hit Redirect Route:** When scanned, the phone hits `GET /go/{slug}` on FastAPI.
3. **Database Lookup:** Backend verifies `is_enabled = true` on the QR code and looks up the single `is_active = true` destination link.
4. **Instant 302 Redirect:** Returns an HTTP 302 Found redirect with `Cache-Control: no-store`.
   - *Why 302 and not 301?* A 301 Moved Permanently is cached indefinitely by mobile browsers. A 302 Found forces the phone to hit the server on every scan, allowing destination switches to take effect in real time.
5. **Background Analytics:** `FastAPI.BackgroundTasks` asynchronously parses the User-Agent (device, OS, browser), resolves GeoIP city/country, hashes the client IP with SHA-256 and a secret salt, and writes to the `scans` table without delaying the redirect.

### 2. Admin Flow (Destination Switching)
1. Admin logs into the React dashboard at `http://localhost:5173`.
2. Admin opens a QR code and clicks **Activate** next to any destination link (e.g., switching from *Website* to *Special Promo*).
3. Backend invokes the PostgreSQL stored procedure `activate_link(qr_id, link_id)`:
   - Within a **single atomic transaction**, sets all links for that QR to `is_active = false` and sets the chosen link to `is_active = true`.
   - The PostgreSQL partial unique index `one_active_link_per_qr` guarantees that at no point can two links be active simultaneously.
4. **Immediate Effect:** The very next scan from any phone redirects to the new destination link!

---

## 🚀 Quick Start Guide

### Step 1: Database Setup (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. In Supabase Dashboard, open **SQL Editor** (`>_` icon) and execute:
   - `backend/app/sql/schema.sql`
   - `backend/app/sql/functions.sql`
   - `backend/app/sql/rls_policies.sql`
3. In **Authentication ➔ Users**, click **Add User ➔ Create User** to add your admin account:
   - **Email:** `admin@qr.com`
   - **Password:** `admin123` (Auto-confirm: Yes)

### Step 2: Environment Configuration
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
- `SUPABASE_URL`: `https://<project-id>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: From Supabase Project Settings ➔ API ➔ `service_role`
- `SUPABASE_JWT_SECRET`: From Supabase Project Settings ➔ API ➔ JWT Settings
- `VITE_SUPABASE_ANON_KEY`: From Supabase Project Settings ➔ API ➔ `anon` / Publishable key

### Step 3: Run Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API running at: `http://localhost:8000`  
Interactive Swagger docs: `http://localhost:8000/docs`

### Step 4: Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Dashboard running at: `http://localhost:5173`

---

## 🧪 How to Test End-to-End Checklist

- [x] **1. Login:** Open `http://localhost:5173`, enter `admin@qr.com` and `admin123`.
- [x] **2. Create QR Code:** Click **+ New QR Code**, enter name `Menu QR`, click **Create**.
- [x] **3. Add 3 Links:**
  - Link 1: Title: `Website`, URL: `https://example.com`
  - Link 2: Title: `YouTube Video`, URL: `https://youtube.com`
  - Link 3: Title: `Instagram`, URL: `https://instagram.com`
- [x] **4. Activate Link 1:** Toggle on `Website`. It turns green with `● Active` badge.
- [x] **5. Download QR:** Click **Download ➔ PNG** to save `qr_<slug>.png`.
- [x] **6. First Scan / Test Redirect:** Open `http://localhost:8000/go/<slug>` in browser. Verify it redirects to `https://example.com`.
- [x] **7. Switch Active Link:** In dashboard, toggle on `YouTube Video`. Toast appears: *"Live from next scan! ✨"*.
- [x] **8. Second Scan / Test Redirect:** Open `http://localhost:8000/go/<slug>` again. Verify it now redirects to `https://youtube.com` immediately!
- [x] **9. Verify Analytics:** Open **Analytics** page. Verify Total Scans incremented, hourly chart updated, and click **Export CSV** to verify logs.

---

## 🚢 Deployment Guide

### Backend (Render / Railway / Fly.io)
Deploy using the included `backend/Dockerfile`:
```bash
docker build -t imqrscan-backend ./backend
docker run -p 8000:8000 --env-file .env imqrscan-backend
```
In Render or Railway:
1. Connect repository, select root directory `backend`.
2. Set Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `IP_HASH_SALT`, `PUBLIC_BASE_URL`.

### Frontend (Vercel / Netlify)
1. Connect repository, select root directory `frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (pointing to deployed backend URL).

---

## 🛡 Security Highlights
- **GDPR Compliant:** Raw visitor IPs are never stored in the database. Every IP is one-way hashed with SHA-256 and a secret salt.
- **Service Role Isolation:** The backend holds the privileged Supabase `service_role` key to log scans and execute atomic link activations. The frontend only ever receives the restricted `anon` key.
- **Strict Protocol Validation:** Only `http://` and `https://` URLs are permitted. Dangerous protocols (`javascript:`, `data:`, `file:`) are strictly blocked.
