# CIRCULO — Hackathon Judge Demo Script & Pitch Guide

> **Core Thesis:** *"India doesn't have a waste problem; it has a coordination problem. The breaks happen at the handoffs."*
> **Platform Stack:** Expo SDK 58 · React Native · React 19 · Strict TypeScript · Zustand · Expo Router · Supabase RLS · Offline-First Voice Notes

---

## 🕒 3-Minute Hackathon Presentation Flow

| Time | Role / Stage | Screen & Actions | Key Talking Point |
|---|---|---|---|
| **0:00 - 0:35** | **Household** (Priya Sharma) | `(household)/dashboard` & `(household)/recycle` | City-specific segregation schedule (BBMP / AMC / MCD), 1-Tap 5kg Cardboard request @ ₹14/kg, Doorstep Handoff QR modal. |
| **0:35 - 1:10** | **Informal Picker** (Lakshmi Bai) | `(picker)/jobs` & `(picker)/market-rates` | Transparent market tariff locking, 56px glove-friendly "Scan Doorstep QR" viewfinder, calibrated scale measurement. |
| **1:10 - 1:45** | **Shared Record Layer** | `FairValueReceiptModal` & `JourneyTimelineModal` | Itemized digital receipt (zero hidden cuts), SHA-256 cryptographic seal, 5-stage chain of custody timeline. |
| **1:45 - 2:20** | **Recycler / MRF** (EcoPlast) | `(recycler)/intake` & `(recycler)/settlement` | Optical/manual quality grading (Grade A / Mixed / Contaminated), transparent itemized deductions, instant UPI settlement. |
| **2:20 - 3:00** | **Municipal Admin** (Ward 151) | `(admin)/requests` & `(admin)/disputes` | Dual switcher: Ward Requests vs Chain of Custody Ledger, one-tap cryptographic seal verification, human-in-the-loop dispute resolution. |

---

## 📱 Detailed Step-by-Step Walkthrough

### Step 1: Login & City Configuration Switcher
1. Launch CIRCULO. On the **Role Selection** screen, tap **Household (Priya Sharma)**.
2. Notice the dynamic banner reflecting active municipal rules.
3. Tap **Profile** $\rightarrow$ scroll to **Active Municipal Corporation**:
   - Switch between **Bengaluru (BBMP)**, **Amritsar (AMC)**, and **Delhi (MCD)**.
   - Observe how the 3-stream bins (Wet, Dry, Sanitary/Hazardous), collection schedules, and language localizations change dynamically.

### Step 2: Household 1-Tap Pickup Request & Doorstep QR
1. Go to **Dashboard**. View the **14-day Circularity Streak** and monthly diversion progress bar (28.5 kg / 40.0 kg).
2. Tap the **⚡ 1-Tap Quick Recyclable Request** button:
   - Instantly schedules 5 kg clean corrugated cardboard at the locked BBMP baseline rate of ₹14.00/kg.
3. Switch to the **Recycle** tab:
   - Locate the scheduled job and tap **Show Doorstep Handoff QR Code**.
   - A scannable QR modal opens with verified PIN `7492` and SHA-256 authenticity token.

### Step 3: Informal Picker Claims & Scans Doorstep QR
1. Tap profile $\rightarrow$ **Switch Role** $\rightarrow$ select **Informal Picker (Lakshmi Bai)**.
2. On **My Jobs**, find the pending pickup:
   - Notice the large, glove-friendly 56px action button: **Scan Doorstep QR**.
3. Tap **Scan Doorstep QR**:
   - The interactive camera viewfinder simulator opens with laser alignment guidelines.
   - Enter PIN `7492` or tap **Simulate Camera Scan**:
   - Status updates instantly to `Collected` with green confirmation sound feedback.
4. Tap **Measure & Generate Receipt**:
   - Confirm calibrated weight (5.2 kg) and locked rate (₹14/kg).
   - Tap **Generate Fair Value Receipt**: An itemized slip appears showing gross ₹72.80, municipal subsidy bonus, and zero middleman deductions.
5. Tap **View Material Journey Timeline**:
   - The 5-stage interactive stepper opens: *Household Listed* $\rightarrow$ *Collector Verified* $\rightarrow$ *MRF Intaked* $\rightarrow$ *Settled via UPI* $\rightarrow$ *Circular Product Lifecycle*.
   - Copy the SHA-256 Ledger Seal (`8f43a91b...`) to clipboard.

### Step 4: Certified Recycler / MRF Intake & Quality Inspection
1. Switch role to **Recycler (EcoPlast Circular Facility)**.
2. Tap **Intake**:
   - Select the incoming cardboard consignment from Lakshmi Bai.
   - Grade the material: Select **Grade A (Clean)** or **Contaminated (>15% Food Residue)**.
   - Observe how contaminated lots trigger itemized cleaning charges transparently, preventing quiet deductions.
3. Tap **Settle Consignment via UPI**:
   - Instant simulated UPI transfer (`UPI-REF-99214`) settles directly into the picker's digital wallet.

### Step 5: Municipal Admin Chain-of-Custody & Dispute Resolution
1. Switch role to **Municipal Admin (Ward 151 Officer)**.
2. On the **Operations / Requests** screen, toggle the top Segmented Control to **Chain of Custody Ledger**:
   - View all verified transactions with SHA-256 cryptographic seals.
   - Tap **Verify Seal**: Shows "Cryptographically Valid — Recorded on Immutable City Ledger".
   - Tap **Material Journey**: Inspects the complete provenance from Priya's doorstep to EcoPlast's pelletizer.
3. Tap the **Disputes** tab:
   - View open disputes (e.g., Weight Mismatch, Contamination Dispute).
   - Tap **Review & Arbitrate**: Review uploaded photo evidence and choose to *Uphold*, *Adjust Total*, or *Split Difference*.

### Step 6: Interactive Educational Boss Challenge (Judge Wow-Factor)
1. Switch back to Household $\rightarrow$ tap **Learn** tab $\rightarrow$ select **Contamination Boss**:
   - Interactive game testing tricky municipal edge cases:
     - *Greasy pizza delivery box* (Food oil ruins pulp $\rightarrow$ Wet waste)
     - *Broken mirror shards* (Metallic chemical backing $\rightarrow$ Hazardous reject)
     - *PLA corn-starch plastic fork* (Melt point mismatch $\rightarrow$ Wet compost)
     - *Tetra Pak juice container* (Multi-layer composite $\rightarrow$ Specialized dry)
   - Dynamic streak counter, sound effects, and municipal guidance explanations.

### Step 7: Real-Time Map Navigation & GPS Simulator (Ultimate Judge Wow-Factor)

CIRCULO features an end-to-end, zero-paid-API real-time navigation system with live GPS tracking across all 4 field roles:

#### A. Household Live Doorstep Tracking
1. Switch to **Household (Priya Sharma)**.
2. From the Dashboard next collection card, tap **Track Live 🧭** (or tap **🧭 Track Live** in Quick Actions).
3. The live map opens displaying Priya's exact doorstep pin (`HouseholdPin`), the moving municipal vehicle, road route polyline, and live ETA header (`Arriving in 6 mins · 1.2 km away`).
4. Toggle between **Municipal Truck** (🚛) and **Doorstep Picker** (🚲).
5. **Launch the GPS Simulator**:
   - Tap the floating **`🛰️ GPS Sim`** pill in the top-left corner.
   - Select **Picker Meena (Approaching Priya)**.
   - Choose **`5x`** speed and tap **Start**.
   - Watch Meena's cart move down the road in real-time. As she crosses the $500\text{ m}$ threshold, the screen triggers the red alert:
     > *"Collector Approaching! (< 500m) — Please place your segregated bins at your doorstep."*
   - As she reaches within 40m, arrival is confirmed!

#### B. Municipal Collector Route Navigation & Stop Optimization
1. Switch to **Formal Collector (Ramesh Kumar)** $\rightarrow$ tap **Route** tab.
2. View today's 12 assigned route stops displayed as numbered `StopPin`s (`done`, `current`, `pending`).
3. Toggle the **On Shift** switch in the top banner: observe the green beacon pulse and live GPS telemetry broadcast to the municipal database.
4. Tap **Optimize Route ⚡**:
   - Runs a Nearest-Neighbour TSP routing algorithm.
   - Previews distance and time saved (e.g. *1.4 km saved · 8 mins faster*).
   - Tap **Apply Optimized Route** (with 1-tap Undo support).
5. Tap **Arrived / Collect Waste** on Stop #1:
   - Verification modal opens: adjust calibrated weight steppers, select 1-5 star segregation rating, and flag contamination.
   - Confirms collection and automatically advances to the next pending stop!
6. Notice the **Truck Load Capacity Bar**:
   - Visual gauge shows `72% Full (3.6 / 5.0 t)`.
   - When $\ge 90\%$, triggers an urgent compactor full alert with 1-tap **Route to Station 🏭** rerouting directly to the Ward 151 Transfer Station!

#### C. Municipal Admin Fleet Telemetry & Hotspot Monitoring
1. Switch to **Municipal Admin (Kavitha Reddy)** $\rightarrow$ tap **Routes & Fleet** tab.
2. View the full-screen interactive city map showing the active municipal fleet:
   - Green compactor trucks with live directional heading arrows and speed.
   - Blue picker carts.
   - Filter chips: **All Fleet**, **Collectors (Trucks)**, **Pickers (Carts)**, and **Complaints Only**.
   - Ward selector: Filter by Ward 151, Ward 111, Ward 134, Ward 174.
3. **Stale Telemetry Detection**:
   - Notice vehicles inactive $>2\text{ min}$ (e.g. Venkatesh N., Raju Nayak) render with an orange `STALE` badge and grayed-out marker pins.
4. **Waste Density Hotspot Circles**:
   - Toggle **Hotspots**: Highlights high-grievance circular density overlays in Ward 151 and Ward 111 with a floating severity legend.
5. **Citizen Grievance Dispatch**:
   - Tap any red alert pin (`ComplaintPin`): view citizen grievance card (e.g. Overflowing Public Bin on 80ft Road).
   - Tap **Assign to Ward Crew**: updates the complaint status and dispatches sanitation crew.
6. **Emergency Civic Broadcast**:
   - Tap **Emergency Broadcast 📢**: enter roadblock message, select severity (Urgent / Warning), tap **Send Broadcast Alert**.
   - Drops an emergency alert pin on the map and dispatches fleet-wide notifications!

---

## 🏆 Key Architectural Innovations to Highlight
1. **Native Maps & Zero-Cost Routing:** Platform native maps (Google Maps on Android, Apple Maps on iOS) + OSRM open routing + Web fallback — 0 paid Google Maps/Mapbox API keys in Expo Go, 0 risk of rate limit lockouts.
2. **The Shared Record Layer:** Eliminates the information asymmetry between informal pickers and commercial recyclers.
3. **Glove-Friendly Touch Targets:** All field interfaces conform to $\ge 56\text{px}$ touch targets with high-contrast text for workers wearing heavy rubber gloves in bright sunlight.
4. **Worker Privacy by Design:** Opt-in shift tracking with visual beacon; 300m approximate circles for unassigned jobs, exact pins only upon verified lock.
5. **Multi-Tier City Adaptability:** City rules (BBMP, AMC, MCD) are decoupled and injected dynamically via JSON schema.
6. **End-to-End Cryptographic Provenance:** Every handoff generates a traceable SHA-256 seal suitable for municipal ESG compliance and EPR (Extended Producer Responsibility) credit audits.
