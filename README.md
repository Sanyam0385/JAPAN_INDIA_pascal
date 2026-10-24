# JAPAN_INDIA_pascal — CIRCULO: Unified Circular Waste Management Platform

CIRCULO is a mobile-first circular waste management application built with **React Native**, **Expo SDK 58**, **TypeScript**, and **Expo Router**. It connects households, formal municipal collectors, informal waste pickers, and municipal supervisors into a unified, traceable civic ecosystem.

---

## 🌟 Hackathon Evaluator Quick Start

### 1. Run the Application
```bash
# Ensure dependencies are installed
npm install

# Start the Expo development server
npx expo start
```

- **Run in Web Browser**: Press `w` in the terminal to open the web preview.
- **Run on Android / iOS**: Open the **Expo Go** app on your phone and scan the QR code displayed in the terminal.

### 2. Evaluator Role Switching (No Login Required)
CIRCULO includes a **Demo Role Selector** specifically built for hackathon judges:
- When the app starts, tap **⚡ Try Demo (No Login Required)**.
- Choose any of the 4 operational roles:
  1. **🏠 Household / Citizen** (`Priya Sharma`)
  2. **🚛 Formal Municipal Collector** (`Ramesh Kumar`)
  3. **♻️ Informal Waste Picker / Recycler** (`Meena Devi`)
  4. **🏛️ Municipal Administrator** (`Kavitha Reddy`)
- Switch roles at any time from the **Profile** tab using the **Switch Demo Role** button.

---

## ♻️ Cross-Role Traceability & Closed-Loop Workflow

All 4 roles operate on the **same shared data model**:
1. **Household Posts Recyclables**: Citizen submits a recycling request (e.g. 5 kg Cardboard, Est. ₹40–₹70) in `(household)/recycle`.
2. **Marketplace Discovery**: The listing immediately appears in the real-time marketplace in `(picker)/opportunities`.
3. **Picker Claim & Route**: Informal picker claims the job, marks "En Route", visits the household, and records actual weighed quantities and negotiated cash payment.
4. **Circularity Passport Updated**: The household's collection history, reward points, and environmental sustainability passport are updated in real time.
5. **Supervisor Oversight**: Municipal administrators view the ward-level audit trail, route telemetry, and landfill diversion tonnages in `(admin)/overview`.

---

## 📱 Role Interface Architecture

### 1. Household / Citizen (`/app/(household)`)
- **Dashboard**: Greeting, next scheduled collection countdown, monthly recycling summary, reward points.
- **Calendar**: 14-day date strip, locality-specific segregation rules (BBMP Zone 3A 3-way segregation guidelines), collection category guide.
- **Learn & Play Game**: Interactive waste segregation game with 20 items, scoring, streaks, instant explanations, and badges.
- **Sell Recyclables**: Request form with automatic price estimation, preferred windows, and active request tracking.
- **Community**: Neighbourhood cleanup drives, volunteer registration, challenges, and simulated fundraising campaigns.
- **Grievances & Complaints**: Civic ticket filing with photo placeholder, status tracking, and municipal resolution audit.

### 2. Formal Municipal Waste Collector (`/app/(collector)`)
- Outdoor-optimized interface with **large touch targets (min 56px)** for workers wearing gloves.
- **Today**: Active shift toggle, today's stops progress, vehicle compactor status, collection stops list.
- **Route & Stops**: Telemetry route overview with GPS fallback.
- **Tasks**: Digital collection recorder for segregated wet/dry/hazardous waste with weight inputs.
- **Earnings**: Municipal payroll summary, attendance allowance, and performance metrics.

### 3. Informal Waste Picker (`/app/(picker)`)
- **Marketplace**: Open recycling collection listings categorized by material (metal, plastic, paper, e-waste).
- **My Jobs**: Active pickups workflow ("Claimed" → "En Route" → "Finalize & Pay").
- **Buyers Directory**: Verified local scrap yards, recycling factories, operating hours, and indicative purchase prices per kg.
- **Earnings Tracker**: Weekly earnings chart, tonnage sold by material, and digital payment verification.
- **Accreditation**: Municipal waste picker ID card, health card status, and safety equipment checklist.

### 4. Municipal Administrator (`/app/(admin)`)
- **Overview**: Ward-level command dashboard, collection efficiency metrics, waste stream composition breakdown (Wet 52%, Dry 32%, Recyclables 13%, Hazardous 3%).
- **Complaints Desk**: Civic grievance management center with status transitions and supervisor resolution notes.
- **Fleet & Routes**: Real-time compactor fleet dispatch and route progress monitoring.
- **Audit Ledger**: Comprehensive traceability ledger of all household-to-picker recycling transfers.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Expo SDK 58, React Native 0.88, React 19 |
| **Navigation** | Expo Router (Typed File-based routing) |
| **State Management** | Zustand (Persistent auth & reactive app store) |
| **Styling & Design** | Deep Forest Green (`#1B5E20`), Emerald & Mint palette, Custom Design Tokens |
| **Database & Auth** | Supabase PostgreSQL with Row Level Security (RLS) policies |
| **Internationalization**| i18next (English, Hindi, Punjabi, Japanese) |

---

## 📂 Project Structure

```
├── app/
│   ├── _layout.tsx               # Root navigation stack & font loading
│   ├── index.tsx                 # Role-based landing redirect
│   ├── (auth)/                   # Welcome, Onboarding, Login, Register, Demo Selector
│   ├── (household)/              # Dashboard, Calendar, Recycle, Learn Game, Community, Profile, Complaints
│   ├── (collector)/              # Shift Overview, Route Map, Tasks Recorder, Earnings, Profile
│   ├── (picker)/                 # Marketplace, Active Jobs, Scrap Buyers Directory, Resale Earnings, Profile
│   └── (admin)/                  # Ward Overview, Complaints Desk, Fleet Routes, Audit Ledger, Profile
├── src/
│   ├── components/ui/            # Reusable Design System: Card, Button, Badge, Screen, Header, StateComponents
│   ├── constants/                # Colors, Spacing, Typography, Roles, Materials
│   ├── lib/
│   │   ├── auth/                 # Standalone Demo Authentication Service
│   │   ├── demo/                 # Deterministic Demo Datasets (households, schedules, buyers, complaints)
│   │   └── supabase/             # Supabase Client configuration
│   ├── stores/                   # authStore & appStore (Zustand)
│   ├── types/                    # Comprehensive TypeScript schemas
│   └── i18n/                     # Localization configuration & language files
└── supabase/
    └── migrations/               # PostgreSQL schema & RLS policies
```

---

## 📜 Compliance & Verification

- ✅ **Strict TypeScript**: Clean compilation with `npx tsc --noEmit`.
- ✅ **Expo Go Compatibility**: Fully runnable on real mobile devices without requiring Xcode or Android Studio.
- ✅ **Zero Secret Leakage**: No hardcoded API keys or secrets in source code.
- ✅ **Realistic Labeling**: All demo balances, prices, and metrics are explicitly labelled as estimates.
