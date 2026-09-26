# METRION — 5-Minute Evaluator Demonstration Script

**SIH26036:** Development of an Online Verification System for Weighing and Measuring Instruments  
**Demo URL:** `http://localhost:5173` (or `http://localhost:3000` via Docker)  
**Demo Notice:** *"DEMO CONFIGURATION — NOT A STATUTORY DETERMINATION"*

---

## 1. Quick Persona Switcher Cheat Sheet

METRION features an integrated **1-Click Persona Switcher** in the top navigation bar. Evaluators can jump between personas instantly without manually logging in and out:

| Persona | Name & Role | Primary Duties in Demo |
|---|---|---|
| **Admin** | R. K. Sharma (Controller) | Scrutiny of applications, scheduling inspection dates, assigning officers, viewing audit ledger. |
| **Owner** | Rajesh Gupta (Apex Retail) | Registering instruments, tracking statutory timeline, applying for verification & re-verification. |
| **LMO** | S. V. Patil (Legal Metrology Officer)| Receiving field assignments, performing on-site calibration checklist, uploading photos, issuing certificates. |
| **GATC** | Precision Metrology Labs (Test Centre) | Conducting delegated private agency laboratory calibrations. |
| **Public / Citizen** | Unauthenticated Scanner | Scanning QR code to verify authenticity in real-time. |

---

## 2. Step-by-Step 5-Minute Demonstration Flow

### Step 1: Citizen / Public QR Verification (Minute 0:00 - 1:00)
1. Navigate to `http://localhost:5173/verify`.
2. Notice the instant search bar and three pre-loaded demo certificates:
   - **Click "VALID Demo":** (`qr_demo_token_valid_001`). Instantly loads green verified badge with issuing officer, authority, and masked serial number. Click **"Download Official Certificate PDF"** to view the real vector PDF with embedded QR code.
   - **Click "EXPIRED Demo":** (`qr_demo_token_expired_002`). Instantly flags amber warning: *"Certificate Expired — Needs Mandatory Re-verification"*.
   - **Click "INVALID Demo":** (`invalid_token_sample`). Instantly displays red alert: *"No authentic certificate record found"*.

### Step 2: Instrument Owner Experience (Minute 1:00 - 2:00)
1. Click **"Switch Persona" -> "Instrument Owner"** in the top-right navbar.
2. The **Owner Dashboard** opens, showing:
   - Active fleet compliance metrics (3 instruments registered).
   - Impending expiry alert: *Weighbridge WB-60T is due for re-verification in 28 days*.
3. Click **"Register Instrument"**:
   - Select Category: `Electronic Road Weighbridge`.
   - Manufacturer: `Essae-Teraoka`, Model: `PR-6000`, Serial: `WB-2026-9901`.
   - Capacity: `60 Ton`, Location: `Taloja Industrial Area, Plot 19`.
   - Click **"Register Instrument"**.
4. Click **"Apply for Verification"**:
   - Select proposed date and submit.
   - The interactive SVG Timeline displays: `SUBMITTED`.

### Step 3: Admin Scrutiny & Assignment (Minute 2:00 - 3:15)
1. Click **"Switch Persona" -> "Admin"** in the top-right navbar.
2. The **Admin Action Queue** highlights the newly submitted application.
3. Click into the application detail:
   - Click **"Accept Application"** (Status advances to `ACCEPTED`).
   - Click **"Schedule Inspection"**: Set scheduled date (tomorrow, 10:00 AM - 1:00 PM).
   - Click **"Assign Verifier"**: Select `S. V. Patil (Legal Metrology Officer)`.
   - Status advances to `ASSIGNED`.
   - The visual timeline and status audit record every decision with UTC timestamps.

### Step 4: LMO Field Inspection & Rule Engine Evaluation (Minute 3:15 - 4:15)
1. Click **"Switch Persona" -> "Legal Metrology Officer"** in the top-right navbar.
2. The **LMO Dashboard** displays "Today's Field Assignments".
3. Click **"Start Field Verification"**:
   - The status updates automatically to `IN_FIELD_VERIFICATION`.
   - The dynamic statutory checklist for `Electronic Road Weighbridge` renders.
4. Fill in empirical observations:
   - *Foundation drainage & load cell seating:* `PASSED`
   - *Load cell conduit integrity:* `PASSED`
   - *Sectional loading tolerance:* Enter `4.2` kg (Max allowed: 20 kg).
   - *Full capacity MPE test:* Enter `12.5` kg (Max allowed: 30 kg).
5. Attach calibration evidence photo (upload sample image).
6. Click **"Submit Verification Result: VERIFIED"**.
   - The backend rule engine executes deterministically.
   - Status advances to `VERIFIED` and then `CERTIFICATE_ISSUED`.
   - A unique digital certificate with dynamic QR token is minted immediately!

### Step 5: Proof of Completion & Full Cycle Audit (Minute 4:15 - 5:00)
1. View the newly generated certificate card and click **"Download Certificate PDF"**.
2. Notice the generated PDF contains the authentic state emblem style, officer signature block, and live QR code.
3. Switch back to **"Admin"** -> **"Audit Ledger"** to demonstrate full government accountability: every action (Intake -> Acceptance -> Scheduling -> Inspection -> Certification) is recorded immutably with user email, role, and timestamp.
