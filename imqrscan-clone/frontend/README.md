# IMQRScan Clone — Frontend Documentation

The frontend is a modern admin dashboard built with **React 18**, **Vite**, **Recharts**, and **Lucide React** icons.

---

## 🧭 Page-by-Page Walkthrough

### 1. Login (`/login` — `pages/Login.jsx`)
- Direct Supabase Auth authentication via `supabase.auth.signInWithPassword`.
- Validates user email & password.
- Stores JWT access token and refreshes sessions automatically via `AuthProvider` / `useAuth`.
- Automatically redirects authenticated users to Dashboard (`/`).

### 2. Dashboard (`/` — `pages/Dashboard.jsx`)
- **4 Rich KPI Cards:**
  - **Total Scans:** Displays lifetime scan count with average scans per day calculation.
  - **Today's Scans:** Real-time counter of scans occurring today, comparing against yesterday's count.
  - **Unique Visitors:** Total distinct devices/visitors (based on salted SHA-256 IP hashes) with percentage of total traffic.
  - **Total QR Codes:** Count of registered QR codes and active links.
- **Active Link Banner (`ActiveLinkCard.jsx`):**
  - Displays the currently active destination URL with real-time green pulsing status dot.
  - Quick action button to view and change active destination.
- **Analytics Charts:**
  - **Scans Over Time (`ScansChart.jsx`):** Area chart showing hourly scan distribution.
  - **Device Split (`DeviceSplit.jsx`):** Donut chart showing Mobile, Tablet, and Desktop breakdown.
- **Live Scan Feed (`LiveScansTable.jsx`):** Real-time list of recent 20 scans with device icon, OS, browser, country, and timestamp.
- **Date Range Filter:** Dropdown to filter overview metrics by Last 7, 30, or 90 days.

### 3. QR Codes & Links (`/qr` or `/links` — `pages/Links.jsx`)
- **QR List Panel:** Left sidebar listing all QR codes with their slug, on/off state, delete button, and download dropdown.
- **QR Preview Card (`QRPreview.jsx`):** High-resolution QR code preview with "Copy Link" and SVG/PNG download buttons.
- **Links Management Panel (`LinkTable.jsx`):**
  - Dynamic rule info banner: "Exactly one destination link is active at all times."
  - "+ Add Link" button opening `AddLinkModal.jsx` with strict HTTP/HTTPS URL validation.
  - Links table displaying #, status dot, Title, Destination URL, 30-day scans count, active badge, and toggle switch.
  - Clicking any inactive link's toggle executes atomic RPC activation and shows an instant toast notification: *"Live from next scan! ✨"*
  - The currently active link's toggle is disabled to prevent 0 active destinations.
  - Edit link modal (`EditLinkModal.jsx`) to update titles and URLs in-place.
  - Cascade delete button with confirmation dialog.

### 4. Analytics (`/analytics` — `pages/Analytics.jsx`)
- QR Code selector dropdown to analyze any specific QR code.
- Period selector: Last 7 days, 30 days, 90 days, or Last year.
- "Export CSV" button to download all raw scan logs for reporting.
- KPI summary cards (Total Scans, Today, Unique Visitors).
- **Scans by Hour of Day:** Bar chart showing peak scanning hours (0..23).
- **Top Breakdown Tables:**
  - Top Countries (with flag/globe indicator)
  - Top Cities (sorted by scan volume)
  - Devices (Mobile, Desktop, Tablet)
  - Browsers (Chrome, Safari, Firefox, Edge, etc.)

### 5. Settings (`/settings` — `pages/Settings.jsx`)
- **Manage QR Code:** Select any QR code and rename it with live instant save.
- **Danger Zone:**
  - **Disable QR Code:** Toggle QR status off. Scanners will immediately receive a friendly 404 "Link Unavailable" page until re-enabled.
  - **Delete QR Code:** Permanent deletion with prompt confirmation.
- **System Environment:** Displays current API URL, Supabase project URL, and quick endpoint references.
