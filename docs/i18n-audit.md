# CIRCULO Multi-Language (i18n) Comprehensive Audit Report

**Generated:** October 24, 2026  
**Target Platform:** Expo SDK 58 / React Native 0.88 / TypeScript Strict  
**Scope:** Complete Codebase (`app/`, `src/`, Demo Data, City Configs, and Core Stores)  
**Supported Locales:** English (`en`), Hindi (`hi`), Punjabi (`pa`), Japanese (`ja`)

---

## 1. Executive Summary & Root Cause Analysis

### The Bug
In **Profile > Settings > Language**, selecting any of the four languages (English, Hindi, Punjabi, Japanese) moves the checkmark UI indicator, but **no screen text updates**. The footer claim *"Full translations active across English, Hindi, Punjabi, and Japanese"* is currently untrue.

### Root Causes
1. **Disconnected State & Engine:** When a user taps a language row in `app/(household)/profile.tsx`, it calls `setLanguage(lang.code)` in `src/stores/appStore.ts`. However, `appStore.ts` only executes:
   ```ts
   setLanguage: (lang) => set({ language: lang })
   ```
   It **never calls `i18n.changeLanguage(lang)`** on the underlying `i18next` instance!
2. **Missing Component Hook Subscriptions:** Over **90%** of the screens and components throughout the application do not import or call `useTranslation()`. Instead, they render raw hardcoded English JSX string literals. Even if `i18n.changeLanguage()` were invoked, those screens would remain English because they have no reactive binding to translation state.
3. **Severe Translation Resource Gaps:**
   - `src/i18n/locales/en.json`: 289 lines (approx. 140 keys)
   - `src/i18n/locales/hi.json`: 103 lines (approx. 45 keys — **68% missing**)
   - `src/i18n/locales/pa.json`: 75 lines (approx. 35 keys — **75% missing**)
   - `src/i18n/locales/ja.json`: 75 lines (approx. 35 keys — **75% missing**)
4. **Hardcoded Demo Data Models:** The demo dataset in `src/lib/demo/demoData.ts` and city configurations in `src/lib/config/cities/` embed English display strings directly into objects (e.g., `status: "Claimed"`, `material: "Cardboard"`, `title: "Indiranagar Lake Clean-up Drive"`, `explanation: "..."`) rather than language-neutral identifiers/keys.
5. **Static Expo Router Tab Bar Titles:** Tab navigators across all 5 roles (`household`, `collector`, `picker`, `admin`, `recycler`) specify literal strings in `<Tabs.Screen options={{ title: '...' }} />`. Because layout files are mounted once, tab headers and labels do not re-render unless keyed or driven reactively by a translation hook.
6. **No Type-Safe Keys:** No `react-i18next.d.ts` declaration exists. Key typos fall back silently without compile-time validation.

---

## 2. Existing i18n Core Setup Analysis (`src/i18n`)

### Current Implementation (`src/i18n/index.ts`)
```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import pa from './locales/pa.json';
import ja from './locales/ja.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  pa: { translation: pa },
  ja: { translation: ja },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
```

### Deficiencies Identified
| Feature | Current State | Required State |
| :--- | :--- | :--- |
| **Language Persistence** | None (in-memory in `appStore`, lost on reload) | Persisted via `AsyncStorage` with a dedicated `languageStore` |
| **Device Detection** | Hardcoded `lng: 'en'` | Detect via `expo-localization`, map system locale to `en`/`hi`/`pa`/`ja` |
| **Instant Switching** | Broken (`i18n.changeLanguage` never called) | Call `i18n.changeLanguage(code)` + Zustand reactive sync |
| **Component Subscriptions** | Used in only 3 auth screens | Universal `useTranslation()` across all 43 active app screens |
| **Tab Bar Reactivity** | Cached static titles | Key navigators on language or use dynamic localized options hook |
| **Fallback & Return** | Standard fallback | `fallbackLng: 'en'`, `returnNull: false`, missing key dev warnings |
| **TypeScript Typing** | `any` string accepted | Module augmentation for `CustomTypeOptions` using `en.json` schema |
| **Plurals & Formatting** | Rigid string concatenation | i18next plural suffixes (`_zero`, `_one`, `_other`), `Intl` for dates/numbers |

---

## 3. Demo Data & Shared State Display Strings Audit

The following domains store hardcoded English text in data structures instead of language-neutral enum keys:

### 3.1 Materials & Waste Categories (`src/lib/demo/demoData.ts`, `types/index.ts`)
- **Current Raw Strings:**
  - `"paper"`, `"plastic"`, `"glass"`, `"metal"`, `"electronics"`, `"cardboard"`
  - `"Corrugated Cardboard"`, `"Rigid Plastics (HDPE)"`, `"Mixed Metal Scrap"`
  - `"wet"`, `"dry"`, `"recyclable"`, `"hazardous"`, `"sanitary"`, `"organic"`
- **Resolution:** Normalize to canonical keys:
  - `materials.paper`, `materials.plastic`, `materials.glass`, `materials.metal`, `materials.electronics`, `materials.cardboard`
  - `materials.corrugatedCardboard`, `materials.hdpePlastic`, `materials.metalScrap`
  - `categories.wet`, `categories.dry`, `categories.recyclable`, `categories.hazardous`, `categories.sanitary`

### 3.2 Status Values & Lifecycle Labels
- **Collection Schedule Statuses:** `scheduled`, `completed`, `missed`, `delayed`, `cancelled`, `rescheduled`
- **Recycling Request & Pickup Job Statuses:** `draft`, `open`, `listed`, `rate_proposed`, `rate_locked`, `accepted`, `claimed`, `en_route`, `collected`, `handed_to_recycler`, `payment_pending`, `completed`, `cancelled`, `disputed`
- **Dispute Statuses:** `under_review`, `investigating`, `resolved`, `countered`
- **Payment Statuses:** `pending`, `paid`, `settled`, `disputed`
- **Complaint Statuses:** `submitted`, `acknowledged`, `assigned`, `in_progress`, `resolved`, `rejected_with_reason`
- **Resolution:** Render via `t(`status.${statusKey}`)` with fallback for legacy status codes.

### 3.3 Worker & Citizen Badges
- **Current Badges:**
  - `"Punctual 5 Days"` ("5 consecutive on-time starts")
  - `"Top Collector Oct"` ("Highest kg collected this month")
  - `"Community Champion"` ("Recognised by resident association")
  - `"Verified Recycler"`, `"Segregation Champion"`, `"Consistent Sorter"`, `"Zero Contamination"`
- **Resolution:** Store badge IDs (`b1`, `b2`, `b3`, etc.) and resolve title & description via `t('badges.<id>.title')` and `t('badges.<id>.desc')`.

### 3.4 Segregation Game & Contamination Challenge Items
- **Items in `learn.tsx` and `demoData.ts`:**
  - `"Greasy Pizza Delivery Box"` (explanation: *"Food oils and cheese grease saturate paper fibers..."*)
  - `"Broken Mirror Shards"` (explanation: *"Mirrors have a chemical metallic backing..."*)
  - `"Aseptic Juice Tetra Pak"` (explanation: *"Tetra paks contain 75% paperboard..."*)
  - `"PLA Compostable Bio-Plastic Fork"` (explanation: *"Corn-starch PLA plastics cannot be mechanically recycled..."*)
  - `"Poly-Coated Paper Coffee Cup"` (explanation: *"Takeaway coffee cups have a thin bonded polyethylene plastic liner..."*)
  - `"Fluorescent CFL Light Bulb"` (explanation: *"CFLs contain hazardous mercury vapor..."*)
  - Standard items: `"Newspaper"`, `"Vegetable Peels"`, `"Plastic Bottle"`, `"Glass Jar"`, `"Old Mobile Phone"`, `"Aluminium Can"`, `"Cardboard Box"`, `"Old Battery"`
- **Resolution:** Create `game.items.<id>.name` and `game.items.<id>.explanation` keys in translation files.

### 3.5 Dispute Reasons & Photo Evidence Types (`RaiseDisputeModal.tsx`)
- **Reason Labels & Descriptions:**
  - `weight_mismatch`: "Weight Mismatch" — "Doorstep measurement differs from logged or scale weight."
  - `rate_changed`: "Rate Changed Without Consent" — "Locked rate was lowered or silent deductions applied."
  - `contamination_unfair`: "Contamination Grading Unfair" — "Lot was downgraded or rejected without valid justification."
  - `payment_not_received`: "Payment Discrepancy" — "UPI transfer not received or wrong amount settled."
- **Evidence Options:** "Digital Scale Photo (7.2 kg)", "Segregated Material Photo", "UPI Bank SMS Proof"
- **Resolution:** Move to `disputes.reasons.*` and `disputes.evidence.*` translation keys.

### 3.6 Contradictory Locality & City Data Fix
- In `src/lib/demo/demoData.ts`, Meena Devi's profile (`demo-picker-1`) has `locality: "Koramangala, Bengaluru"`, while the role badge displays *"Informal Waste Recycler Partner"* and locality line hardcodes *"📍 BBMP Ward 151, Koramangala"*.
- In `app/(household)/profile.tsx`, line 97 renders:
  ```tsx
  <Text style={styles.userRole}>Household · {household.locality} ({currentCityConfig.name})</Text>
  ```
  This creates contradictory and nested brackets (e.g., *"Household · Koramangala (Bengaluru (BBMP))"*).
- **Resolution:** Standardize to `"${translatedRole} · ${locality}, ${cityName}"` without nested brackets.

---

## 4. Comprehensive Screen-by-Screen Hardcoded String Inventory

Below is the exhaustive audit of all **43 files** containing hardcoded strings across the application:


### 4.1 Auth & Onboarding

#### `app/(auth)/demo-select.tsx`
- **Text Children (1):** "Choose a Stakeholder"

#### `app/(auth)/login.tsx`
- **Text Children (1):** "CIRCULO"
- **Alerts/Modals (1):** [Password Reset: A password recovery link has been simulated for ${email.trim() || ]
- **Props/Placeholders/Titles (3):** accessibilityLabel="Forgot password", accessibilityLabel="Sign In", accessibilityLabel="Create account"

#### `app/(auth)/onboarding.tsx`
- **Text Children (3):** "Skip", "0 ? (", "Back"

#### `app/(auth)/register.tsx`
- **Text Children (0):** 
- **Props/Placeholders/Titles (5):** label="Household", label="Collector", label="Waste Picker", accessibilityLabel="Create Account", accessibilityLabel="Log In"

#### `app/(auth)/welcome.tsx`
- **Text Children (1):** "CIRCULO"
- **Props/Placeholders/Titles (1):** accessibilityLabel="Try demo without login"


### 4.2 Household Screens

#### `app/(household)/calendar.tsx`
- **Text Children (7):** "Collection Calendar", "Koramangala Zone 3A · BBMP", "No collection scheduled this day", "Upcoming Collections", "Recent History", "s.date", "Waste Categories Guide"

#### `app/(household)/community.tsx`
- **Text Children (5):** "Volunteer, challenge, and connect", "Upcoming Cleanup Events", "0 && (", "Neighbourhood Challenges", "Fundraising Campaigns"
- **Alerts/Modals (4):** [Cancel Registration?: You will be unregistered from this event.], [Registered! 🎉: You are now registered for this event.\n\n⚠️ Demo mode — no real notification will be sent.], [Demo Mode: Challenge joining is a demo feature.\nNo real tracking occurs.], [Community Drive 💡: Thank you for supporting community circularity!\nYour pledge has been simulated in the local impact fund.]
- **Props/Placeholders/Titles (1):** label="Registered"

#### `app/(household)/complaints.tsx`
- **Text Children (10):** "Report issues and track resolution", "Report", "My Complaints", "No complaints filed yet", "Resolution:", "File a Complaint", "Category *", "Description *", "Location", "Photo evidence upload requires a development build"
- **Alerts/Modals (2):** [Missing Info: Please select a category and enter a description.], [Complaint Filed ✅: Reference: ${ref}\n\nYour complaint has been submitted and will be reviewed within 3 working days.\n\n⚠️ Demo mode — no real action will be taken.]
- **Props/Placeholders/Titles (2):** placeholder="Describe the issue in detail...", placeholder="Enter location / locality"

#### `app/(household)/dashboard.tsx`
- **Text Children (25):** "0 && (", "Active City Rules", "Next Municipal Doorstep Collection", "View full collection calendar →", "ONE-TAP RECYCLABLES", "Locked Rate: ₹14/kg", "5 kg Corrugated Cardboard", "Pickup Logged! Assigned to nearby collector.", "Request Doorstep Pickup (1-Tap)", "Monthly Circularity Target", "Diverted from municipal landfills", "diverted", "Quick Actions", "Monthly Summary", "Verified environmental impact metrics" ... (+10 more)
- **Props/Placeholders/Titles (1):** label="Scheduled"

#### `app/(household)/learn.tsx`
- **Text Children (19):** "Circularity Academy", "Segregation Game", "Watch & Learn", "Standard City Sort", "CHALLENGE", "Contamination Boss", "Tricky edge cases: pizza grease, mirrors, PLA bio-plastics", "Tap the correct municipal bin below:", "Continue to Next Item →", "Score", "Best Streak", "Accuracy", "Play Another Round 🔄", "DAILY CIRCULARITY TIP", "Clean In = Fair Value Out" ... (+4 more)

#### `app/(household)/profile.tsx`
- **Text Children (40):** "VERIFIED", "Points", "Collections", "Badges", "Active Municipal Corporation", "Waste segregation rules & collection schedules adapt dynamically to your municipality.", "Household Info", "Members", "Locality", "Ward", "Segregating", "Since", "Privacy & Live Location", "Share live location during active pickups", "When enabled, assigned waste pickers receive your live proximity to coordinate doorstep handover. Never tracked silently." ... (+25 more)
- **Alerts/Modals (3):** [Sign Out: Are you sure you want to sign out?], [Reset Simulated Data: This will reset all pickup jobs, rate offers, disputes, and receipts to their initial simulated state.], [Reset Complete: Simulated ledger and states have been reset.]

#### `app/(household)/recycle.tsx`
- **Text Children (30):** "Track circular handoffs, lock rates & view verified receipts", "New", "Verified Circularity Guarantee", "Every pickup is tracked through CIRCULO's Shared Record Layer. Rates are agreed and locked before doorstep weighing.", "Recyclable Handoffs Tracker", "End-to-end audit trail from your home to registered MRFs", "Tap "+ New" to list your recyclable items for pickup", "ESTIMATED PAYOUT", "Doorstep arrival in ~6 mins. Keep recyclables packed & ready.", "Show Doorstep Handoff QR Code", "View Fair Value Receipt", "Review Collector Rate Offer", "Lock the rate before doorstep collection", "COLLECTOR PROPOSED RATE", "Your Counter Rate (₹/kg):" ... (+15 more)
- **Alerts/Modals (6):** [Missing Info: Please fill in all required fields.], [Recyclables Listed ✅: Your ${qty} kg of ${selectedMaterial.toUpperCase()} has been published to the verified picker marketplace at ₹${proposedRate}/kg asking rate.], [Rate Locked! 🔒: Rate locked at ₹${rate.toFixed(2)}/kg. The collector will weigh at your doorstep using this tariff.], [Invalid Rate: Please enter a valid rate per kg.], [Limit Reached: Only 1 counter-offer is permitted per transaction to maintain transparency.], [Counter-Offer Sent 💬: Counter-offer of ₹${counterRate.toFixed(2)}/kg sent to collector. Waiting for confirmation.]
- **Props/Placeholders/Titles (4):** placeholder="e.g. 15.50", placeholder="e.g. 5", placeholder="Enter pickup address", placeholder="e.g. Items are bundled and kept near gate"

#### `app/(household)/_layout.tsx`
- **Text Children (1):** "0 && ("


### 4.3 Collector Screens

#### `app/(collector)/earnings.tsx`
- **Text Children (12):** "My Earnings", "Municipal payroll — BBMP Zone 3", "ESTIMATED DISBURSEMENTS", "This Month", "Oct 2026", "Last Month", "Sep 2026", "This Month Breakdown", "Estimated — Demo only", "This Week — kg Collected", "Estimated · Demo data", "Recent Payments"

#### `app/(collector)/profile.tsx`
- **Text Children (17):** "Employee ID: EMP-BBMP-2024-0231", "Zone 3 · Koramangala Division", "Profile Details", "This Month Stats", "Collections", "4.2t", "KG Collected*", "94%", "On-Time*", "Recognition Badges", "Demo badges — not official certifications", "Notifications", "0 && (", "Mark all read", "No notifications" ... (+2 more)
- **Alerts/Modals (1):** [Sign Out: Are you sure you want to sign out?]

#### `app/(collector)/route.tsx`
- **Text Children (12):** "Today's Route", "Zone 3A · Koramangala Sector", "List View", "Map View", "Map integration requires native build", "Switch to List View", "Done", "Current", "Pending", "58% complete · Demo estimate", "All Stops", "Now"

#### `app/(collector)/tasks.tsx`
- **Text Children (9):** "Record Collection", "Log today's pickups (Demo mode)", "New Collection", "Stop / Address", "Waste Category", "Weight (kg)", "Notes (optional)", "Attach Photo (Demo — requires native build)", "Recent Collections Today"
- **Alerts/Modals (3):** [Invalid weight: Please enter a valid weight in kg.], [Demo: Collection Recorded: ${weight} kg of ${CATEGORY_LABELS[selectedCategory]} waste recorded.\n(Demo only — not sent to backend)], [Camera unavailable: Camera requires a native build.\nNot available in Expo Go.]
- **Props/Placeholders/Titles (2):** placeholder="Enter weight in kg (e.g. 12.5)", placeholder="Add any collection notes..."

#### `app/(collector)/today.tsx`
- **Text Children (18):** "Municipal Collector · Zone 3 Sanitation Route", "Vehicle: KA-01-M-2234 · Calibrated Scale Ready", "Report a Field Issue", "Contaminated bin, locked gate, blocked access", "Today's Route Progress", "Total Stops", "Completed", "Remaining", "kg Collected", "Next Up on Route", "Current Stop", "Mark Done (56px)", "Flag Issue", "Report Field Issue", "Logging for:" ... (+3 more)
- **Props/Placeholders/Titles (1):** placeholder="e.g. Mixed wet and chemical plastic in bin"

#### `app/(collector)/_layout.tsx`
- **Text Children (1):** "0 && ("


### 4.4 Waste Picker Screens

#### `app/(picker)/buyers.tsx`
- **Text Children (5):** "Scrap Buyers & MRFs", "Verified recycling centres, processing hubs & certified scales", "No Facilities Found", "Try searching for another material like "metal", "plastic", or "paper".", "ACCEPTED MATERIALS & TARIFFS:"
- **Alerts/Modals (1):** [Verified Recycler Contact: Facility: ${name}\nDirect Hotline: ${phone}\n\nAccredited drop-off and weighing hub with certified electronic scales.]
- **Props/Placeholders/Titles (1):** placeholder="Search by facility name, material, or locality..."

#### `app/(picker)/earnings.tsx`
- **Text Children (15):** "Earnings & Sales", "Track recycling resale income, volume, and verified receipts", "THIS MONTH'S TOTAL RECYCLING SALES", "Material Resold", "Pickups Made", "Avg / Pickup", "Weekly Resale Income", "Total: ₹4,430", "Fair Value Receipts & Settlements", "Verified chain-of-custody transaction slips", "No settlement receipts recorded yet.", "View Fair Value Receipt", "Sales by Material", "Payment Verification", "Recycling transactions can be paid via direct UPI or cash. CIRCULO maintains an immutable ledger for municipal circularity audit."
- **Props/Placeholders/Titles (1):** label="Cleared (UPI, simulated)"

#### `app/(picker)/jobs.tsx`
- **Text Children (17):** "My Jobs", "Track assigned pickups, weigh recyclables & generate receipts", "No Active Pickups", "Go to the Marketplace tab to claim new recyclable collection opportunities.", "I'm En Route", "Scan Doorstep QR", "Record Collection & Pay", "No Completed Pickups Yet", "Receipt", "Traceability", "Finalize Pickup", "Enter the verified weighed quantity and final negotiated amount handed to the household. A Fair Value Receipt will be generated.", "Measured Weight (kg) *", "Agreed Amount Paid (₹) *", "Confirm, Pay & Issue Receipt" ... (+2 more)
- **Alerts/Modals (4):** [Status Updated: Job marked as ${newStatus.replace(/_/g, ], [Invalid Amount: Please enter a valid agreed payment amount.], [Pickup Finished! 🎉: Payment of ₹${amount.toFixed(2)} recorded. Fair Value Receipt ${newReceipt.receiptNumber} generated.], [Handoff Verified ✅: Doorstep QR verified and logged into Shared Record Layer.]
- **Props/Placeholders/Titles (2):** placeholder="e.g. 5.2", placeholder="e.g. 65"

#### `app/(picker)/opportunities.tsx`
- **Text Children (23):** "Marketplace", "Open recyclable waste pickups & rate negotiation", "All Materials", "Within 3 km", "Nearest", "Highest Payout", "Locked Rates Before Pickup", "Once you and the household agree, rates are locked in the Shared Record Layer so weights are paid accurately at doorstep.", "No Pickups Found", "No open listings match your current filters. Try turning off "Within 3 km" or selecting "All Materials".", "Rate Locked", "Offer Active", "EST. WEIGHT", "AGREED RATE", "EST. PAYOUT" ... (+8 more)
- **Alerts/Modals (8):** [Claim Pickup Job 🔒: Rate is locked at ₹${lockedRate.toFixed(2)}/kg for ${job.estimatedKg} kg of ${job.material.toUpperCase()} (Est. Payout ₹${(lockedRate * job.estimatedKg).toFixed(2)}).\n\nClaim this job now?], [Job Claimed! 📦: You have claimed this pickup. Proceed to ${job.location.ward} during window: ${job.window}.], [Lock Asking Rate & Claim: Lock rate at asking price ₹${askingRate.toFixed(2)}/kg and claim this pickup?], [Rate Locked & Job Claimed! ✅: Rate locked at ₹${askingRate.toFixed(2)}/kg. Added to My Jobs.], [Rate Locked! 🔒: Rate officially locked at ₹${currentRate.toFixed(2)}/kg before collection. You can now claim the job.], [Invalid Rate: Please enter a valid rate per kg.], [Limit Reached: Only 1 counter-offer is permitted per transaction to maintain transparency.], [Counter-Offer Sent 💬: Proposed ₹${counterRate.toFixed(2)}/kg sent to household. The rate will lock once confirmed.]
- **Props/Placeholders/Titles (2):** label="Listed", placeholder="e.g. 16.00"

#### `app/(picker)/profile.tsx`
- **Text Children (16):** "Informal Waste Recycler Partner", "Municipal Waste Picker ID", "ID Number:", "WP-BBMP-2026-0849", "Issued By:", "BBMP Solid Waste Management Cell", "Health Card:", "Active (Annual Checkup Done)", "Primary Zones:", "Koramangala 3rd & 4th Block", "Puncture-resistant Heavy Duty Gloves", "Reflective High-Visibility Vest", "Digital Hanging Weighing Scale (Calibrated)", "N95 Dust & Particulate Masks", "Switch Demo Role (Judge Quick Switch)" ... (+1 more)
- **Alerts/Modals (1):** [Sign Out: Are you sure you want to exit your picker session?]
- **Props/Placeholders/Titles (1):** label="Verified Recycler"

#### `app/(picker)/_layout.tsx`
- **Text Children (1):** "0 && ("


### 4.5 Municipal Admin Screens

#### `app/(admin)/complaints.tsx`
- **Text Children (31):** "Complaints & Arbitration", "Supervise citizen grievances and Shared Record Layer disputes", "Fair Value Disputes", "0 && (", "Citizen Grievances", "No Disputes in This Queue", "All handoffs and Fair Value Receipts are currently in agreement.", "PARTY ACCUSED", "Claimed", "Recorded", "Variance", "ARBITRATION RESOLUTION", "View Receipt", "Review & Arbitrate", "No Complaints Under This Filter" ... (+16 more)
- **Alerts/Modals (6):** [Missing Note: Please provide an official resolution action note.], [Grievance Resolved ✅: The citizen has received an in-app resolution notification.], [Status Updated: Grievance status changed to ${nextStatus}.], [Note Required: Please enter a supervisor arbitration note for the immutable audit trail.], [Dispute Arbitrated & Reconciled ⚖️: Action: ${arbitrationAction.toUpperCase()}\nResolution: ${resolutionDesc}\n\nThe Fair Value Receipt has been reconciled in the Shared Record Layer and all parties notified.], [Receipt Record: Receipt record for ${receiptNumber ?? jobId} is verified on the municipal ledger.]
- **Props/Placeholders/Titles (3):** label="Validated", placeholder="Add supervisor findings and justification for the record...", placeholder="Enter actions taken..."

#### `app/(admin)/overview.tsx`
- **Text Children (37):** "MUNICIPAL COMMAND DESK · WARD 151", "Supervisory Overview", "Live Telemetry", "TOTAL KG DIVERTED", "Today • 4,280 kg MoTD", "FAIR VALUE DISBURSED", "100% Cleared via UPI", "ACTIVE RECORD DISPUTES", "2.1% of verified lots", "ACCREDITED PICKERS", "6 Certified", "Across 3 MRF Drop-off Hubs", "CONTAMINATION AUDIT DESK", "Ward Segregation Quality & Risk Hotspots", "OFFENDING LOCALITIES (LOT REJECTION RATE):" ... (+22 more)
- **Alerts/Modals (1):** [Targeted Segregation Advisory Dispatched 📢: BBMP Ward 151 households have received an in-app notice: ]

#### `app/(admin)/profile.tsx`
- **Text Children (18):** "Executive Officer · SWM Division", "Bruhat Bengaluru Mahanagara Palike (BBMP)", "Municipal Jurisdiction", "Zone:", "South Zone, Bengaluru", "Ward:", "Ward 151 (Koramangala)", "Total Population:", "48,200 Citizens", "Solid Waste Rules:", "SWM By-laws 2020 (Mandatory 3-way)", "Data & Verification", "Supabase Realtime Sync", "Connected in Demo Adapter Mode", "Export SWM Monthly Audit" ... (+3 more)
- **Alerts/Modals (1):** [Sign Out: Sign out of municipal administrative session?]
- **Props/Placeholders/Titles (1):** label="Ward Supervisor"

#### `app/(admin)/requests.tsx`
- **Text Children (18):** "Ward Recycling Ledger", "Audit trail of household recyclable transfers & settlement slips", "Total Requests", "Diverted Weight", "Total Cleared", "Fair Value Receipt", "Material Journey", "Cryptographically Audited Chain of Custody", "Every physical handoff is recorded with calibrated scale metrics and SHA-256 hash stamp.", "UPI CLEARED", "CRYPTOGRAPHIC SHA-256 SEAL:", "Household:", "Collector:", "Destination MRF:", "LOCKED RATE" ... (+3 more)
- **Alerts/Modals (1):** [Cryptographic Verification ✅: Seal Validated: SHA-256 Ledger Match\n\nSlip Number: ${receipt.receiptNumber}\nHash: ${receipt.ledgerHash}\nStatus: Verified Immutability on Postgres Record Layer]

#### `app/(admin)/routes.tsx`
- **Text Children (6):** "Fleet & Route Dispatch", "Daily municipal waste collection routes", "Live Collector & Fleet Telemetry", "Active GPS Feed", "Assigned Collector", "Payload Today"
- **Props/Placeholders/Titles (1):** label="Live GPS"


### 4.6 Recycler Facility Screens

#### `app/(recycler)/history.tsx`
- **Text Children (10):** "Intake History", "Verified recycling intakes, quality grades & UPI settlements", "Total Intakes", "Recovered Material", "Grade A Ratio", "Intake Audit Trail", "Immutable slips recorded to municipal circularity ledger", "No Intakes Recorded", "Process incoming lots in the Weigh-In tab to generate verified intake records.", "View Fair Value Receipt"

#### `app/(recycler)/incoming.tsx`
- **Text Children (18):** "MRF INTAKE DOCK", "Incoming Loads", "Scale Online", "Lots in Transit", "Expected Inflow", "500 kg", "Daily Cap", "Material Handoff Verification", "Accredited pickers deliver pre-sorted materials. Inspect cleanliness, confirm gross vs tare tare on calibrated scale, and assign quality grade.", "Lots Awaiting Intake & Weigh-In", "Select a lot to begin scale tare, grading and settlement", "Intake Dock Clear", "No picker loads are currently en route to your facility.", "DECLARED WEIGHT", "LOCKED RATE" ... (+3 more)

#### `app/(recycler)/profile.tsx`
- **Text Children (9):** "Facility Profile", "Licensed material recovery facility & purchase rates", "Switch Role", "KSPCB AUTHORIZED MRF", "Operator: Vikram Joshi", "Daily Intake Capacity", "Purchasing Tariffs (₹/kg)", "Rates published directly to the picker marketplace", "Sign Out of Recycler Account"
- **Alerts/Modals (1):** [Tariffs Updated ✅: Your purchasing rates have been synchronized with the picker marketplace and buyers directory.]

#### `app/(recycler)/weigh-in.tsx`
- **Text Children (25):** "Weigh-In Station", "Electronic scale calibration, grading & settlement", "Calibrated", "1 && (", "Select Incoming Lot:", "DIGITAL WEIGHT TRANSDUCER (S/N: MRF-4029)", "ZERO / TARE", "NET WEIGHT", "kg", "GROSS WEIGHT (kg)", "TARE CART (kg)", "Quality Grading", "Contamination Feedback Note", "This note will automatically notify the collector and origin household with actionable segregation tips.", "Itemized Deductions Calculator" ... (+10 more)
- **Alerts/Modals (4):** [Scale Calibrated: Tare set to ${grossInput} kg. Scale zeroed.], [No Lot Selected: Please select an incoming lot to process.], [Invalid Weight: Net weight must be greater than 0 kg.], [Intake Verified & Settled 🎉: Net ${netWeight.toFixed(2)} kg verified. Payout of ₹${finalPayout.toFixed(2)} cleared via instant UPI.\n\nReceipt #${receipt.receiptNumber} generated.]
- **Props/Placeholders/Titles (3):** placeholder="12.5", placeholder="2.0", placeholder="e.g. Found food residue, bottle caps unremoved, high grease content."

#### `app/(recycler)/_layout.tsx`
- **Text Children (1):** "0 && ("


### 4.7 Shared Components & UI

#### `src/components/auth/AuthScreenHeader.tsx`
- **Text Children (5):** "Preferences & Utilities", "Choose Language", "Reset Simulated Ledger", "Restore initial mock jobs, rates and receipts", "Done"
- **Alerts/Modals (1):** [Simulated Ledger Reset: All demo data and handoff records have been restored to their fresh default state.]
- **Props/Placeholders/Titles (2):** accessibilityLabel="Go back", accessibilityLabel="App Settings and Language Selection"

#### `src/components/auth/CirculoLogoBadge.tsx`
- **Text Children (0):** 
- **Props/Placeholders/Titles (1):** accessibilityLabel="CIRCULO Emblem. Long press for quick demo role switcher."

#### `src/components/auth/RoleCard.tsx`
- **Text Children (0):** 
- **Props/Placeholders/Titles (1):** accessibilityLabel="Select role: ${label}"

#### `src/components/location/LocalityChip.tsx`
- **Text Children (0):** 
- **Props/Placeholders/Titles (1):** accessibilityLabel="Current locality: ${displayLocality}"

#### `src/components/shared/FairValueReceipt.tsx`
- **Text Children (30):** "CIRCULO", "FAIR VALUE RECEIPT", "CIRCULARITY PASSPORT", "CHAIN OF CUSTODY", "ORIGIN", "COLLECTOR", "DESTINATION", "MATERIAL", "MEASURED WEIGHT", "AGREED RATE", "ITEM SPECIFICATION", "AMOUNT (INR)", "TOTAL FAIR VALUE", "Agreed rate × Verified weight", "Payment Status:" ... (+15 more)
- **Alerts/Modals (3):** [Error: Receipt view not ready for capture.], [Receipt Captured: Saved image to: ${uri}], [Share Failed]

#### `src/components/shared/JourneyTimelineModal.tsx`
- **Text Children (8):** "CIRCULAR TRACEABILITY", "Material Journey Timeline", "MATERIAL", "NET WEIGHT", "CLEARED VALUE", "SHARED RECORD LAYER LEDGER SEAL", "This batch cannot be tampered with or modified. Cryptographically stamped on the shared circular ledger.", "Share Verified Passport"
- **Alerts/Modals (1):** [Chain of Custody Passport: Circulo Verified Material Journey: ${slipNum}\n${material} · ${weight} kg\nLedger Hash: ${ledgerHash.slice(0, 16)}...]

#### `src/components/shared/RaiseDisputeModal.tsx`
- **Text Children (26):** "Fair Value Dispute Flow", "What is the primary discrepancy?", "Select the issue that applies to this handoff. All disputes are reviewed by neutral municipal supervisors.", "Attach Photographic Proof", "Upload clear photos of scale readouts, sorted materials, or transaction messages for administrative audit.", "Timestamp: Just now • Certified SHA-256 Hash", "Tip: Tapping an evidence photo simulates attaching a scale snapshot with geolocation metadata.", "Specify Details & Variance", "State your claimed values versus what was recorded on the receipt.", "Recorded Weight", "Claimed Weight (kg)", "Recorded Rate", "Agreed Rate (₹/kg)", "Detailed Explanation *", "Review Dispute Submission" ... (+11 more)
- **Alerts/Modals (3):** [Selection Required: Please select an issue category.], [Notes Required: Please provide a short explanation describing the issue.], [Dispute Submitted for Arbitration ⚖️: Case Reference: ${disputeId.toUpperCase()}\nStatus: Under Human Review.\n\nMunicipal Admin will inspect the photographic evidence and scale audit logs.]
- **Props/Placeholders/Titles (3):** placeholder="e.g. 7.2", placeholder="e.g. 15.0", placeholder="Describe what occurred during the weighing or payment handoff..."

#### `src/components/ui/StateComponents.tsx`
- **Text Children (1):** "Oops!"
- **Props/Placeholders/Titles (1):** label="Try Again"


---

## 5. Structured Translation Key Architecture & Namespaces

Translations will be structured into high-cohesion namespaces:

```json
{
  "common": {
    "appName": "CIRCULO",
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try Again",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "submit": "Submit",
    "back": "Back",
    "next": "Next",
    "done": "Done",
    "close": "Close",
    "share": "Share",
    "export": "Export",
    "verified": "Verified",
    "estimate": "Estimate",
    "currency": "₹"
  },
  "roles": {
    "household": "Household",
    "formal_collector": "Waste Collector",
    "informal_picker": "Waste Picker",
    "municipal_admin": "Administrator",
    "recycler": "Recycler Facility"
  },
  "tabs": {
    "home": "Home",
    "calendar": "Calendar",
    "recycle": "Recycle",
    "learn": "Learn",
    "community": "Community",
    "profile": "Profile",
    "today": "Today",
    "route": "Route",
    "tasks": "Tasks",
    "earnings": "Earnings",
    "marketplace": "Marketplace",
    "jobs": "My Jobs",
    "buyers": "Buyers",
    "overview": "Overview",
    "complaints": "Complaints",
    "routes": "Routes",
    "requests": "Requests",
    "incoming": "Incoming",
    "weighIn": "Weigh-In",
    "history": "History"
  },
  "status": {
    "scheduled": "Scheduled",
    "completed": "Completed",
    "missed": "Missed",
    "delayed": "Delayed",
    "open": "Open",
    "accepted": "Accepted",
    "en_route": "En Route",
    "collected": "Collected",
    "payment_pending": "Payment Pending",
    "resolved": "Resolved",
    "in_progress": "In Progress",
    "disputed": "Disputed"
  },
  "materials": {
    "wet": "Wet Waste",
    "dry": "Dry Waste",
    "recyclable": "Recyclables",
    "hazardous": "Hazardous",
    "sanitary": "Sanitary",
    "plastic": "Plastic",
    "paper": "Paper",
    "cardboard": "Cardboard",
    "metal": "Metal",
    "glass": "Glass",
    "electronics": "E-Waste"
  },
  "household": { ... },
  "collector": { ... },
  "picker": { ... },
  "admin": { ... },
  "recycler": { ... },
  "profile": { ... },
  "game": { ... },
  "disputes": { ... },
  "receipts": { ... },
  "errors": { ... }
}
```

---

## 6. Typography, Font Support & Layout Safeguards

1. **Devanagari, Gurmukhi & Japanese Font Rendering:**
   - In React Native, Hindi matras (ु, ू, ि, ी) and Punjabi accents (ੰ, ੱ) frequently get clipped if text containers have tight `lineHeight` or fixed container heights.
   - We will configure adequate `lineHeight` scaling in typography tokens and ensure all buttons and badges use flexible padding rather than rigid pixel heights.
2. **Bottom Tab Bar Truncation Prevention:**
   - Long labels in German/Hindi/Punjabi can overflow tab icons.
   - Use concise tab titles (`tabs.*` namespace, e.g. "कचरा" / "ਕੂੜਾ" instead of multi-word sentences).
   - Set `numberOfLines={1}`, `adjustsFontSizeToFit={true}`, and `minimumFontScale={0.8}` on tab bar label styles.
3. **Number, Date & Currency Formatting:**
   - Replace hardcoded `'en-IN'` with dynamic locale:
     - English: `en-IN`
     - Hindi: `hi-IN`
     - Punjabi: `pa-IN`
     - Japanese: `ja-JP`
   - Currency stays unified as ₹ (INR) across Indian municipal operations.

---

## 7. Next Implementation Steps (Steps 2 – 6 Roadmap)

- **Step 2:** Re-architect `src/i18n/index.ts` with `react-i18next`, `languageStore` (AsyncStorage persistence + `expo-localization` auto-detection), root provider re-render triggers, and TypeScript key augmentation.
- **Step 3:** Systematically migrate all 43 files, replacing string literals with `t('...')`, dynamic plurals, and locale-aware `Intl` formatters. Complete real human translations for all keys across `en.json`, `hi.json`, `pa.json`, and `ja.json`.
- **Step 4:** Enhance the Language Selector in Profile > Settings and on the Auth Header modal with native names, immediate re-rendering, active coverage metrics, and confirmation toasts in the newly chosen language.
- **Step 5:** Optimize layout elasticity for 360px viewports, adjust font line-heights for Devanagari/Gurmukhi, fix the profile header format, and synchronize inconsistent demo data.
- **Step 6:** Create the `npm run i18n:check` safety net script (`scripts/i18n-check.ts`), dev-mode missing key logger, and "Show translation keys" debug toggle.
