# METRION — Complete System Demonstration Guide & Workflow Procedure
**Problem Statement:** SIH26036 — Development of an Online Verification System for Weighing and Measuring Instruments  
**Platform Identity:** METRION — Digital Verification & Certificate Lifecycle Platform  
**Environment:** SIH26036 • Prototype Environment  

---

## 1. Executive Summary & Demo Objectives

METRION solves the statutory requirement of digitizing the end-to-end verification, calibration, and certification lifecycle of commercial weighing and measuring instruments.

### Key Demo Storyline (The 10-Stage Loop):
$$\text{Register} \longrightarrow \text{Apply} \longrightarrow \text{Scrutinize} \longrightarrow \text{Schedule} \longrightarrow \text{Assign} \longrightarrow \text{Inspect (MPE)} \longrightarrow \text{Certify} \longrightarrow \text{Authenticate (QR)} \longrightarrow \text{Audit} \longrightarrow \text{Re-verify}$$

### Core Value Propositions Demonstrated to Judges:
1. **Single Instrument $\rightarrow$ Multi-Year Provenance:** An instrument retains a permanent identifier (`LM-INST-XXXXXX`) across years of periodic re-verification cycles.
2. **Objective, Deterministic Field Testing:** LMOs/GATCs conduct physical verification using numerical Maximum Permissible Error (MPE) tolerances, checklist versioning, and photo evidence.
3. **Tamper-Evident Digital Certificates:** Digital Form VI certificates with unique cryptographic tokens and instant public QR verification.
4. **Instant Anti-Fraud Authentication:** Differentiating between **CURRENT / VALID**, **EXPIRED**, **REVOKED**, and **INVALID** certificates in under 1 second.
5. **Append-Only Regulatory Audit Ledger:** Immutable event logs with synthetic SHA-256 digests tracking every state transition.

---

## 2. System Access & Demo Personas

The application includes selectable demo persona cards on the Login page and a quick persona switcher in the top navigation bar.

| Persona Role | User Name | Email Address | Password | Primary Functions |
| :--- | :--- | :--- | :--- | :--- |
| **Instrument Owner** | Sanjay Gupta | `owner@demo.legalmet.local` | `DemoPass@123` | Register instruments, lodge applications, track timeline, download certificates |
| **Administrator** | Rajesh Sharma | `admin@demo.legalmet.local` | `DemoPass@123` | Operational queue scrutiny, accept/reject applications, allocate field officers, audit logs |
| **Field Officer (LMO)** | Inspector Vikram Malhotra | `lmo@demo.legalmet.local` | `DemoPass@123` | Field inspection roster, execute Form VII checklists, numerical MPE tests, upload photos |
| **Test Centre (GATC)** | Dr. Ananya Sen | `gatc@demo.legalmet.local` | `DemoPass@123` | Accredited third-party laboratory verification, heavy platform calibration |

**Application Access URLs:**
- **Local PC:** `http://localhost:5173/`
- **Phone / Tablet (Same Wi-Fi Network):** `http://10.192.73.66:5173/`
- **Backend API (Swagger):** `http://10.192.73.66:8000/docs`
- **Public QR Verification:** `http://10.192.73.66:5173/verify/:token`

---

## 3. Step-by-Step Complete Demonstration Flow

### STEP 1: Landing Page & Public Authenticity Check
**URL:** `http://localhost:5173/`  
**Goal:** Show the portal entry point and explain the SIH26036 solution.

1. Open `http://localhost:5173/` in your web browser.
2. **Key Talking Points:**
   - Emphasize the platform identity: **METRION — Digital Verification & Certificate Lifecycle Platform**.
   - Note the absence of fake government claims or misleading national crests; highlight the clean prototype badge (**SIH26036 • PROTOTYPE ENVIRONMENT**).
   - Point out the 3 core pillars: *Instrument Registry*, *Field Inspection Engine*, and *QR Authentication*.
3. Click **"Sign In to Platform"** in the top right.

---

### STEP 2: Login Page & Lifecycle Architecture
**URL:** `http://localhost:5173/login`  
**Goal:** Showcase the two-column login screen with the lifecycle visualization.

1. **Left Column:** Explain the 7-stage lifecycle diagram:
   - `REGISTER` $\rightarrow$ `APPLY` $\rightarrow$ `SCHEDULE` $\rightarrow$ `VERIFY` $\rightarrow$ `CERTIFY` $\rightarrow$ `AUTHENTICATE` $\rightarrow$ `RE-VERIFY`.
2. **Right Column:** Click the **"OWNER (Instrument Owner)"** demo card.
   - The email `owner@demo.legalmet.local` and password will prefill automatically.
3. Click **"Sign In"**. You will be directed to the **Owner Dashboard**.

---

### STEP 3: Owner Operational Dashboard
**URL:** `http://localhost:5173/owner/dashboard`  
**Goal:** Show enterprise KPI metrics and action alerts.

1. **KPI Strip:**
   - **Registered Instruments:** Total equipment count.
   - **Pending Applications:** Active verification requests in progress.
   - **Active Certificates:** Valid Form VI certificates.
   - **Due for Re-verification:** Instruments nearing statutory calibration expiration.
2. **Action Required Section:** Highlights equipment nearing due date and field inspections scheduled for today.
3. **Verification Activity Table:** Shows the latest applications, current stages, and direct links to view dossiers.

---

### STEP 4: Instrument Registry & Digital Onboarding
**URL:** `http://localhost:5173/owner/instruments`  
**Goal:** Demonstrate instrument registration and administrative table registry.

1. Click **"Registered Instruments"** in the left sidebar.
2. Notice the administrative table with **Instrument ID**, **Make & Model**, **Category**, **Serial Number**, **Status**, and **Verification Due Date**.
3. Click **"Register New Instrument"** (`/owner/instruments/new`).
4. Fill in the structured form:
   - **Category:** Non-Automatic Weighing Instruments (NAWI)
   - **Manufacturer:** *Mettler Toledo*
   - **Model:** *IND570 Weighbridge Terminal*
   - **Serial Number:** *MT-2026-WB-9912*
   - **Capacity:** *50,000 kg*
   - **Accuracy Class:** *Class III (Medium Accuracy)*
   - **Year of Manufacture:** *2025*
   - **Premises Address:** *Plot 42, Transport Nagar, Mandi Precinct*
   - **State / District / Pincode:** *Delhi / Central Delhi / 110001*
   - **Declaration:** Check the accuracy attestation box.
5. Click **"Register Instrument"**.
6. The screen presents the confirmation card displaying the newly assigned Permanent Identifier: **`LM-INST-XXXXXX`**.
7. Click **"Lodge Verification Application Now →"** directly from the confirmation screen.

---

### STEP 5: Lodging a Verification Application
**URL:** `http://localhost:5173/owner/applications/new`  
**Goal:** Submit a structured verification dossier.

1. The instrument will already be preselected.
2. **Section 2 (Verification Type):** Choose **"Initial Verification"** (or *Periodic Re-verification*).
3. **Section 3 (Proposed Window):** Pick a convenient date (e.g., next business day) and preferred time slot (*Morning 10:00 - 01:00*).
4. **Section 4 (Premises & Contact):** Confirms on-site verification address and phone number.
5. **Section 5 (Declarations):** Accept standard readiness declaration (standard weights on site, clear access).
6. Click **"Submit Verification Application"**.
7. You are navigated to the **Application Dossier** (`/owner/applications/:id`).
   - Point out the 6-stage lifecycle progression bar: `1. Lodgement (COMPLETED)` $\rightarrow$ `2. Scrutiny (CURRENT)` $\rightarrow$ `3. Scheduling` $\rightarrow$ `4. Allocation` $\rightarrow$ `5. Inspection` $\rightarrow$ `6. Issuance`.

---

### STEP 6: Switch Persona to Administrator (Scrutiny & Scheduling)
**Goal:** Demonstrate operational control room and review workflow.

1. Click the top header **"DEMO"** dropdown $\rightarrow$ Select **"Administrator (Rajesh Sharma)"**.
2. You are navigated to the **Admin Dashboard** (`/admin/dashboard`).
3. **Admin Control Room:**
   - Review the queue metrics: Pending Review, Scheduled, In Field, Completed.
   - Filter queue tabs by clicking **"PENDING REVIEW"**.
4. In the queue table, find the newly submitted application and click **"Review Dossier →"** (or navigate to `/admin/applications`).
5. **On the Application Scrutiny Page (`/admin/applications/:id`):**
   - **Step 1: Scrutiny Determination:**
     - Select: `ACCEPT — Verified for Field Inspection Scheduling`.
     - Enter notes: *"Documentation and serial number verified against manufacturer specs. Approved for field testing."*
     - Click **"Commit Scrutiny Determination"**.
   - **Step 2: Field Roster Scheduling & Verifier Allocation:**
     - The scheduling form appears automatically.
     - Select inspection date and slot.
     - Choose authority: **Department Officer (LMO)**.
     - Assign verifier: **Inspector Vikram Malhotra (LMO)**.
     - Directive: *"Conduct eccentricity and repeatability tests up to 50 T standard weights."*
     - Click **"Schedule & Assign Case to Officer"**.
   - Note the status changes to **ASSIGNED / SCHEDULED**.

---

### STEP 7: Switch Persona to Field Officer (LMO Field Inspection)
**Goal:** Show the mobile-optimized inspection application with Form VII checklist and MPE validation.

1. Click the top header **"DEMO"** dropdown $\rightarrow$ Select **"Field Officer (Inspector Vikram Malhotra)"**.
2. You are navigated to the **LMO Dashboard** (`/lmo/dashboard`).
3. Under **"Today's Field Verification Assignments"**, find the assigned case and click **"Conduct Inspection"** (or click **"Field Verification"** in the sidebar).
4. **The Field Verification Workflow (`/lmo/verification/:id`):**
   - Note the 5-step numbered progress indicator:
     - `01 Instrument` $\rightarrow$ `02 Checklist` $\rightarrow$ `03 Observations` $\rightarrow$ `04 Evidence` $\rightarrow$ `05 Result`.
   - **Checklist Testing (Numerical MPE Validation):**
     - *Check 1 (Visual Nameplate & Make):* Click **PASS**.
     - *Check 2 (Zero Setting & Balancing):* Click **PASS**.
     - *Check 3 (Repeatability Error at Half Load):*
       - Enter observed value: `0.02` (Permissible: 0.00 – 0.05).
       - The system displays a green **"Compliant (Within Tolerance)"** badge.
     - *Check 4 (Eccentricity Error at Corner Loading):*
       - Enter observed value: `0.03` (Permissible: 0.00 – 0.05).
     - *Check 5 (Sensitivity Test):* Click **PASS**.
   - **Physical Sealing & Evidence:**
     - Enter Lead / Plastic Seal Number: `SEAL-DL-2026-9844`.
     - Click **"Capture Photo"** or choose an evidence file (e.g., photo of seal applied).
   - **Verdict & Declaration:**
     - Select **"PASS — Complies with Legal Metrology Standards"**.
     - Verification Officer Declaration is checked.
     - Click **"Submit Verification Result & Issue Certificate"**.
5. **Instant Issuance:** The verification engine validates compliance, stamps Form VI, and generates the digital certificate with an immutable QR token.

---

### STEP 8: Inspect the Digital Certificate
**URL:** `http://localhost:5173/owner/certificates`  
**Goal:** Show two-column certificate view and downloadable PDF.

1. Switch persona back to **"Instrument Owner"** (or inspect directly).
2. Go to **"Digital Certificates"** (`/owner/certificates`).
3. **Left Column:** Table of all certificates with valid-until dates and status badges.
4. **Right Column:**
   - Displays the selected certificate particulars:
     - Certificate ID: `LM-CERT-2026-XXXXXX`
     - Instrument ID: `LM-INST-XXXXXX`
     - Verification Date & Due Date (1 year validity)
     - Designated Verifying Officer
   - Clear, sharp QR Code with caption: *"Scan to authenticate certificate"*.
   - Action buttons:
     - **[ View Certificate ]** (Links to public verification page)
     - **[ Download PDF ]** (Downloads stamped PDF)
     - **[ Print ]** (Opens clean print stylesheet)

---

### STEP 9: QR Certificate Authentication (The "Judge Moment")
**URL:** `http://localhost:5173/verify/:token`  
**Goal:** Demonstrate instant public trust verification without login.

1. Click **"Verify Certificate"** in the top navigation or sidebar.
2. Notice the quick-preset demonstration chips at the top of the page:
   - Click **`CURRENT / VALID`** (Token `566440c77dfe41bea33ebd891145c29e`):
     - Displays large green checkmark badge: **AUTHENTIC CERTIFICATE — CURRENT**.
     - Shows equipment serial number, issuing officer, and validity dates.
     - Footnote: *"Verified against METRION certificate records"*.
   - Click **`EXPIRED`** (Token `c3d4e5f6a1b27890abcdef1234567892`):
     - Displays high-contrast amber/red alert: **CERTIFICATE EXPIRED**.
     - Clearly informs the public or enforcement officer that re-verification is overdue.
   - Click **`REVOKED`** (Token `498ecbd380b24840af8dd1ca8928b2f4`):
     - Displays dark red shield: **CERTIFICATE REVOKED**.
     - Explains that the certificate was invalidated due to seal tampering or meter discrepancy.
   - Enter a random string like `fake-qr-code-999`:
     - Displays red alert: **INVALID TOKEN — RECORD NOT FOUND**.
     - Prevents counterfeit or fabricated physical certificates from passing scrutiny.

---

### STEP 10: Complete Instrument Lifecycle History & Timeline
**URL:** `http://localhost:5173/owner/instruments/:id`  
**Goal:** Demonstrate complete audit provenance of a single instrument over multiple verification cycles.

1. Navigate to **"Registered Instruments"** $\rightarrow$ Click any instrument to view its profile.
2. Select the **"VERIFICATION HISTORY"** tab.
3. Observe the vertical, connected lifecycle timeline:
   - `Instrument Registered` (Date, serial number engraved)
   - `Application Lodged` (New Verification)
   - `Application Accepted & Scheduled` (Assigned LMO)
   - `Field Inspection Completed` (Passed MPE testing)
   - `Digital Certificate Issued` (`LM-CERT-2026-XXXXXX`)
   - `Periodic Re-verification Cycle` (Subsequent applications and tests)
4. Highlight that no verification record is ever lost or replaced.

---

### STEP 11: Immutable Audit Trail & Regulatory Ledger
**URL:** `http://localhost:5173/admin/audit`  
**Goal:** Demonstrate compliance logging and cryptographic integrity.

1. Switch to **Administrator** persona.
2. Click **"Audit Log"** in the sidebar.
3. **Audit Ledger Highlights:**
   - **Metrics Strip:** Total Ledger Entries, State Transitions, Certificate Operations, Cryptographic Status (**SHA-256 Validated**).
   - **Dense Data Table:**
     - Exact timestamp
     - Actor email
     - User Role badge (`ADMIN`, `LMO`, `GATC`, `OWNER`)
     - Operational Action (`APPLICATION_STATUS_UPDATE`, `SCHEDULE_CREATED`, `CERTIFICATE_ISSUED`)
     - State Shift visualization: `SUBMITTED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `SCHEDULED`
     - Synthetic SHA-256 integrity hash for each event.
   - Quick filters for *Scrutiny*, *Schedules*, and *Certificates*.

---

## 4. Quick Persona & Route Quick Reference Table

| Page / Route | Role Access | Primary Demonstration Purpose |
| :--- | :--- | :--- |
| `/login` | Public | 2-column layout with lifecycle diagram & persona cards |
| `/owner/dashboard` | Owner / Admin | Metric blocks, action items, verification activity table |
| `/owner/instruments` | Owner / Admin | Registered instruments directory with due dates |
| `/owner/instruments/new` | Owner / Admin | Multi-section instrument registration form |
| `/owner/instruments/:id` | Owner / Admin | 4-tab dossier & vertical connected lifecycle timeline |
| `/owner/applications` | Owner / Admin | Verification applications docket & status badges |
| `/owner/applications/new` | Owner / Admin | 5-step verification request lodging form |
| `/owner/certificates` | Owner / Admin | 2-column certificate browser with QR code & print/download |
| `/admin/dashboard` | Admin | Operational control room & stage queue tabs |
| `/admin/applications` | Admin | Scrutiny review queue with status filters |
| `/admin/applications/:id` | Admin | Administrative scrutiny & officer scheduling modal |
| `/admin/audit` | Admin | Append-only regulatory audit ledger with SHA-256 hashes |
| `/lmo/dashboard` | LMO / Admin | Field inspection roster & today's assigned cases |
| `/lmo/verification/:id` | LMO / GATC / Admin | Form VII inspection, numerical MPE test, seal photo upload |
| `/verify/:token` | Public | Instant public QR authentication (Valid, Expired, Revoked, Invalid) |

---

## 5. Script / Talking Points for a 3-Minute SIH Presentation

### Minute 1: The Problem & The Solution
> *"Respected evaluators, under Problem Statement SIH26036, the verification of weights and measures across commercial establishments is historically paper-heavy, prone to physical stamping tampering, and lacks a centralized digital provenance trail.*  
>  
> *We present **METRION: Digital Verification & Certificate Lifecycle Platform**.  
> METRION provides a unified operational environment connecting Instrument Owners, Legal Metrology Officers (LMOs), accredited test centres (GATCs), and Directorate Administrators."*

### Minute 2: The Operational Workflow
> *"Notice the operational lifecycle: an instrument owner registers an instrument once and receives a permanent identifier. When verification is due, they lodge an application with their preferred inspection window.*  
>  
> *The Administrator reviews the dossier in the operational control room, validates technical specifications, and assigns an LMO.  
> The Field Officer opens METRION on a tablet or mobile device. Rather than a subjective form, our field verification engine enforces numerical Maximum Permissible Error (MPE) tolerances from standardized rule checklists, records the physical lead seal serial, and captures photographic evidence.*  
>  
> *Upon officer approval, METRION instantly generates a digital Form VI certificate with an embedded cryptographic QR token."*

### Minute 3: Trust, Provenance & Anti-Fraud
> *"Now observe the public trust layer: anyone—a consumer, commercial trader, or enforcement officer—can scan the certificate's QR code without logging in. METRION instantly authenticates the certificate against its live records, distinguishing between Valid, Expired, Revoked, and Invalid certificates.*  
>  
> *Every action, from application lodgement to certificate revocation, is logged in an append-only, tamper-evident regulatory audit trail with SHA-256 cryptographic hashes.*  
>  
> *METRION delivers complete precision, traceability, and operational control for SIH26036."*

---

## 6. How to Start the System Locally

If the servers are ever stopped, restart them with these terminal commands:

### Backend Server (FastAPI on Port 8000):
```powershell
cd c:\Users\antho\.gemini\antigravity-ide\scratch\legalmet_verify
python -m uvicorn app.main:app --port 8000 --reload
```

### Frontend Server (Vite + React on Port 5173):
```powershell
cd c:\Users\antho\.gemini\antigravity-ide\scratch\legalmet_verify\frontend
npm run dev
```

### Run End-to-End Test Suite:
```powershell
cd c:\Users\antho\.gemini\antigravity-ide\scratch\legalmet_verify
python test_workflow_e2e.py
```
*(All 12 backend checkpoints will run and print green pass indicators).*
