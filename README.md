# CIRCULO — Mobile Circular Economy & Shared Record Layer

> **Product Thesis:** *"India doesn't have a waste problem; it has a coordination problem. The breaks occur at the handoffs."*
>
> CIRCULO creates an immutable **Shared Record Layer** linking **Households $\rightarrow$ Formal Municipal Collection $\rightarrow$ Informal Waste Pickers $\rightarrow$ Certified Recyclers / MRFs $\rightarrow$ Municipal Administration**.

---

## 🌟 Quick Start & Live Demo

### 1. Launch the Application
```bash
# Start development server on tunnel mode
npx expo start --tunnel
```
- **Mobile Device (iOS / Android)**: Scan the QR code in your terminal with **Expo Go** (Android) or the **Camera app** (iOS).
- **Web Browser**: Press `w` in your terminal to open the web version.
- **Typecheck Verification**: `npx tsc --noEmit` (0 errors, strict TypeScript mode).
- **i18n Safety Check**: `npm run i18n:check` (100% parity across English, Hindi, Punjabi, and Japanese).

### 2. 5 Evaluator Operational Roles (Instant One-Tap Switcher)
Tap **⚡ Try Demo (No Login Required)** on the welcome screen or switch roles anytime via **Profile $\rightarrow$ Switch Role**:
1. **🏠 Household / Citizen** (`Priya Sharma` · Bengaluru / Amritsar / Delhi)
2. **🚛 Formal Collector** (`Ramesh Kumar` · Municipal Tipper Fleet)
3. **♻️ Informal Picker** (`Meena Devi` / `Lakshmi Bai` · Doorstep Recyclables Entrepreneur)
4. **🏭 Certified Recycler / MRF** (`EcoPlast Circular Facility` · Mechanical Flaking & Quality Grading)
5. **🏛️ Municipal Admin** (`Kavitha Reddy` · Ward 151 BBMP Supervisor)

---

## 🔄 Dual-Mode Backend Architecture

CIRCULO features a zero-friction **Dual-Mode Engine** governed by `isBackendEnabled()`:
- **Cloud Mode**: When `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are provided in `.env`, the app binds to a live Supabase Postgres database with Email OTP account verification, atomic RPC claiming, and live WebSockets subscriptions.
- **Offline Demo Mode**: If environment variables are missing or network connectivity is unavailable, CIRCULO operates with in-memory persistence and full cross-role simulation. The 5 evaluator roles always work instantly without requiring internet or OTP.

---

## ☁️ Supabase Cloud Backend Setup

### 1. Execute SQL Migrations (in order)
In your **Supabase Dashboard** -> **SQL Editor** -> **New Query**, run the migration scripts located in [`supabase/migrations/`](file:///c:/Users/tando/Downloads/JAPAN_DAY%20-%20Copy/supabase/migrations/):

1. [`001_initial_schema.sql`](file:///c:/Users/tando/Downloads/JAPAN_DAY%20-%20Copy/supabase/migrations/001_initial_schema.sql): Base core schema.
2. [`002_add_missing_schema.sql`](file:///c:/Users/tando/Downloads/JAPAN_DAY%20-%20Copy/supabase/migrations/002_add_missing_schema.sql): Supporting tables and columns.
3. [`003_profiles_and_auth_trigger.sql`](file:///c:/Users/tando/Downloads/JAPAN_DAY%20-%20Copy/supabase/migrations/003_profiles_and_auth_trigger.sql): User `profiles`, `handle_new_user` signup trigger, role immutability trigger, and helper `public.current_role()`.
4. [`004_realtime_schema_and_rls.sql`](file:///c:/Users/tando/Downloads/JAPAN_DAY%20-%20Copy/supabase/migrations/004_realtime_schema_and_rls.sql): Realtime tables (`pickup_jobs`, `rate_offers`, `receipts`, `recycler_intakes`, `disputes`, `issues`, `complaints`, `notifications`, `live_locations`), atomic `claim_job` RPC function, server-enforced receipt total validator, and publication to `supabase_realtime`.
5. [`supabase/seed.sql`](file:///c:/Users/tando/Downloads/JAPAN_DAY%20-%20Copy/supabase/seed.sql): Seed MRF recycling centers and municipal city configurations.

### 2. Verify Realtime Publication
Go to **Database** -> **Replication** -> **`supabase_realtime`** publication, and confirm the following tables are enabled:
- `pickup_jobs`, `rate_offers`, `receipts`, `recycler_intakes`, `complaints`, `issues`, `notifications`, `live_locations`.

### 3. Seed Pre-Confirmed Demo Accounts
The repository includes a local seed script that automatically creates pre-confirmed Supabase auth users for the 5 demo roles, bypassing OTP:
1. Create a `.env.local` file in the project root (git-ignored, local use only):
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
   ```
2. Run the seed script:
   ```bash
   npm run seed
   ```
   This will output the pre-confirmed credentials for Priya, Ramesh, Meena, Kavitha, and the Recycler.

### 4. Configure App Environment Variables
Copy `.env.example` to `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## ⚡ How to Test Realtime with Two Devices or Browser Tabs

You can test real-time synchronization between two browser tabs or mobile devices:

1. **Tab 1 — Household (`Priya Sharma`)**:
   - Go to **Recycle** -> Enter `15 kg` Cardboard -> Tap **Post Request to Marketplace**.
   - Your request is listed in Ward 151.
2. **Tab 2 — Informal Waste Picker (`Meena Devi`)**:
   - Log in or switch to Meena Devi (Ward 151).
   - **Instantly**, an in-app banner toast appears:
     > *"New Request Nearby! 15 kg Cardboard in Ward 151"*
   - The job appears at the top of the **Opportunities** tab without page refresh.
   - Tap **Accept Request**.
3. **Tab 1 — Live Sync**:
   - Priya's screen instantly updates to **"Collector Assigned: Meena Devi"** with a toast alert.
4. **Live GPS Tracking**:
   - In Tab 2, Meena Devi taps **Start Route (En Route)**.
   - Meena's device begins broadcasting simulated GPS coordinates every 6 seconds over Supabase channel `job:<id>`.
   - In Tab 1, Priya's screen displays the **LiveRouteTracker** with a pulsating radar beacon and dynamic doorstep arrival track!

---

## 🛡️ Security, RLS & Verification Tests

CIRCULO enforces strict Row Level Security (RLS) policies and security triggers:
- **Role Isolation**: Self-signup users can only register as `household` or `informal_picker`. Administrative or recycler privileges can never be self-assigned.
- **Atomic Concurrency**: Job claiming uses the security-definer function `public.claim_job()`. Two pickers clicking "Accept" simultaneously can never double-claim the same job.
- **Receipt Protection**: Receipts can only be viewed by the household that created the request, the assigned collector, and the buyer facility.
- **Anonymous Protection**: Anonymous users have 0 read/write access to platform data.

### Run RLS Automated Test Suite
To verify RLS rules on your Supabase instance, run [`supabase/tests/rls.test.sql`](file:///c:/Users/tando/Downloads/JAPAN_DAY%20-%20Copy/supabase/tests/rls.test.sql) in the Supabase SQL Editor:
```sql
-- Runs in an isolated transaction and prints [PASS] for all 5 security tests:
-- 1. User A cannot read User B's receipts
-- 2. User A cannot update User B's profile role
-- 3. Picker cannot claim a job already claimed by another picker
-- 4. Household cannot lock rate for a job they don't own
-- 5. Anonymous users cannot read any protected tables
```

---

## 🔐 Email OTP Configuration (Supabase Dashboard)

For new citizen account registration with 6-digit one-time email codes:
1. In Supabase Dashboard, navigate to **Authentication** > **Providers** > **Email**:
   - **Enable Email provider**: `ON`
   - **Confirm email**: `ON`
2. In **Email Templates** > **Confirm signup**:
   - Subject: `Your CIRCULO Verification Code`
   - Body: Include `{{ .Token }}`.
3. In **URL Configuration**, set **OTP Expiry** to `600` seconds (10 minutes).
4. For production volume or testing on real inboxes, configure **Custom SMTP** (e.g. Gmail App Password, Resend, or SendGrid) to bypass Supabase's default rate limits.

---

---

## 🗺️ Real-Time Map Navigation & Routing Engine

CIRCULO includes a zero-paid-API, fully cross-platform geospatial navigation system designed for Indian municipal operations and informal waste recovery:

### 1. Zero-Key Cross-Platform Native Maps
- **Native Platform Default**: Native Android uses Google Maps via `PROVIDER_GOOGLE` (which runs out-of-the-box without an API key in Expo Go), and native iOS uses Apple Maps (provider undefined). Map type is set to `standard`.
- **Centralized Provider Config**: Configured in `src/lib/maps/config.ts`. Production Android standalone APK/AAB builds require a Google Maps API key in `app.json` (`android.config.googleMaps.apiKey`) read from an environment variable (e.g. `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`), never committed to source code.
- **Routes & Attribution**: Road routing is powered by OSRM (`Routes: OSRM / OpenStreetMap data`).
- **Zero-Tile Web Preview**: On web browsers (`CirculoMap.web.tsx`), maps provide a clean list view with an "Open in Google Maps" external link, preventing tile server usage.

### 2. Public OSRM Road Routing & Offline Fallback
- Road routing uses the public OSRM HTTP API (`src/lib/maps/routing.ts`) configured with strict `User-Agent` headers, 6-second request timeouts, and an in-memory route cache.
- If network drops or OSRM times out, CIRCULO instantly generates straight-line fallback routes with realistic speed estimates:
  - **20 km/h**: Informal waste picker hand-cart / cycle-cart
  - **25 km/h**: Municipal compactor truck
  - **5 km/h**: Walking pedestrian

### 3. Worker Privacy Guardrails
- **Opt-In Shift Location**: Live GPS coordinates are published to `live_locations` only when workers explicitly toggle "On Shift" or "Start Route".
- **Visual Privacy Beacon**: Clear "Live location on" indicator reminds workers of active GPS sharing.
- **Doorstep Security**: Unclaimed opportunities render an approximate 300m radius circle; exact doorstep pins are unveiled only after an informal picker locks the job rate.

### 4. Glove-Friendly Field UI
- All field buttons, stop pins, and map controls conform to touch targets $\ge 56\text{px}$ with high-contrast text and tactile haptic feedback, engineered for workers wearing heavy rubber sanitation gloves in bright sunlight.

---

## 🛰️ Evaluator GPS Movement Simulator

To enable hackathon judges and evaluators to experience live real-time map navigation without physically walking around Bengaluru:

1. Open any map screen across any role:
   - **Household Doorstep Tracking**: `(household)/tracking`
   - **Collector Route Navigation**: `(collector)/route`
   - **Picker Turn-by-Turn Navigation**: `(picker)/navigate/[jobId]`
   - **Admin Fleet Telemetry**: `(admin)/routes`
2. Tap the floating **`🛰️ GPS Sim`** pill in the top-left corner of the map.
3. Select an evaluation scenario:
   - **🚛 Collector Ramesh (Route 3A)**: Simulates Ramesh driving a municipal compactor truck through Ward 151 stops. When within 40m of stops, stop status automatically updates to completed!
   - **🚲 Picker Meena (Approaching Priya)**: Simulates Meena navigating her recyclable cart from 850m away to Priya's doorstep. As she crosses 500m, the screen triggers the red `"Collector Approaching! (< 500m)"` banner and countdown.
   - **🚨 Emergency Roadblock Broadcast**: Dispatches an urgent civic alert on 80ft Road via `notificationsApi` and diverts fleet vehicles along alternate corridors.
4. Select playback speed: **`1x`** (Realtime), **`5x`** (Demo pace), or **`10x`** (Fast-forward).
5. Tap **Start**, **Pause**, or **Reset** at any time.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Core Framework** | React Native 0.88, Expo SDK 58, React 19 |
| **Maps & Geospatial** | `react-native-maps@1.29.11`, OpenStreetMap Tiles, Leaflet Web Fallback |
| **Turn-by-Turn Routing** | Public OSRM API, Haversine geodesy, Nearest-Neighbour TSP stop optimization |
| **Type System** | TypeScript Strict Mode (0 errors, strict schema types) |
| **Backend & Realtime** | Supabase (PostgreSQL, Row Level Security, Broadcast channels, RPCs) |
| **Navigation** | Expo Router (Typed file-based routing) |
| **State Management** | Zustand (Persistent `authStore`, `appStore`, `locationStore`, `simulatorStore`) |
| **Styling & Tokens** | Deep Forest Green (`#1B5E20`), Emerald & Mint, 56px Touch Targets |
| **Internationalization** | i18next (100% key parity across `en`, `hi`, `pa`, `ja` — 766 keys) |
| **Security & Audits** | Zero client-side `service_role` keys, SHA-256 ledger seals, RLS tests |

---

## 📖 Presentation Guide
Consult [`DEMO_SCRIPT.md`](file:///c:/Users/tando/Downloads/JAPAN_DAY%20-%20Copy/DEMO_SCRIPT.md) for the 3-minute hackathon presentation flow, role-by-role live demo instructions, and pitch thesis talking points.
