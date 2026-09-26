# METRION

**SIH26036:** Development of an Online Verification System for Weighing and Measuring Instruments  
**Team Name:** Smart Metrology Innovations  
**Status:** Complete Working Prototype & End-to-End Statutory Implementation

> **Statutory Notice:** All seed data, test certificates, and demonstration checklists are tagged:  
> `DEMO CONFIGURATION — NOT A STATUTORY DETERMINATION`

---

## 1. Executive Summary

In India's Legal Metrology ecosystem, millions of commercial weighing and measuring instruments (retail scales, weighbridges, fuel dispensers, storage tanks) require mandatory initial verification and periodic re-verification to protect consumers and prevent commercial fraud. 

Legacy systems are fragmented, rely heavily on paper certificates susceptible to forgery, and lack transparent lifecycle tracking. 

`METRION` is an end-to-end digital verification management platform built on a core architectural foundation:  
**"THE INSTRUMENT IS THE LONG-LIVED DIGITAL ENTITY."**

Verification applications, schedules, officer assignments, and field inspection events represent transactional milestones over an instrument's multi-year operational lifetime.

---

## 2. Key Capabilities

- **Strict Statutory Workflow State Machine:** 11-stage auditable state transitions (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `ACCEPTED` → `SCHEDULED` → `ASSIGNED` → `IN_FIELD_VERIFICATION` → `RESULT_SUBMITTED` → `VERIFIED` → `CERTIFICATE_ISSUED`).
- **Human Grounding (No Fake AI):** Physical inspection is conducted by authorized Legal Metrology Officers (LMO) or Government Approved Test Centres (GATC). The system serves as a deterministic statutory co-pilot.
- **Deterministic Rule & Checklist Engine:** Automatically loads versioned statutory standards (e.g. Non-Automatic Weighing Instruments Class III, Weighbridges) and evaluates Maximum Permissible Error (MPE) thresholds.
- **Genuine Vector PDF & Dynamic QR Generator:** Issues standardized verification certificates with embedded ReportLab vector security elements, cryptographic SHA-256 integrity digests, and live verification URLs.
- **Public Instant Verification Portal:** Allows citizens and enforcement squads to scan the physical QR code on an instrument to verify authenticity without needing login credentials.
- **1-Click Hackathon Persona Switcher:** Switch between `Admin`, `Instrument Owner`, `LMO (Officer)`, and `GATC (Agency)` instantaneously from the top navigation bar.

---

## 3. Technology Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, ReportLab (Vector PDF Generation), QRCode (PIL), Direct Bcrypt, Pytest.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Database:** SQLite (Default for zero-setup evaluation) / PostgreSQL (Production ready).
- **DevOps:** Docker, Docker Compose, Nginx Multi-stage container builds.

---

## 4. Quick Start (Run Locally in 2 Minutes)

### Option A: Local Bare-Metal (Recommended for Evaluation)

#### Terminal 1 — Backend API
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On Linux/macOS: source venv/bin/activate

pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API & Docs:* `http://localhost:8000/docs`

#### Terminal 2 — Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Web Application:* `http://localhost:5173`

---

### Option B: Docker Compose

```bash
docker-compose up --build -d
```
*Web Application:* `http://localhost:3000`  
*API Documentation:* `http://localhost:8000/docs`

---

## 5. Demo Personas & Pre-Seeded Credentials

All test accounts share the password: `DemoPass@123`

| Persona / Role | Email | Description & Responsibilities |
|---|---|---|
| **Admin** | `admin@demo.legalmet.local` | Legal Metrology Controller. Scrutiny, scheduling, officer assignments, audit logs. |
| **Instrument Owner** | `owner@demo.legalmet.local` | Apex Retail Pvt Ltd. Register instruments, apply for verification, download certificates. |
| **Legal Metrology Officer (LMO)** | `lmo@demo.legalmet.local` | S. V. Patil, Sub-Divisional Officer. Field calibration, MPE checklists, certificate issuance. |
| **GATC (Test Centre)** | `gatc@demo.legalmet.local` | Precision Metrology Labs. Accredited private agency verifications. |
| **Public / Citizen** | *Unauthenticated* | Open `/verify` page or scan physical QR code. |

---

## 6. Running Automated Tests

Run the full end-to-end integration and security test suite:

```bash
cd backend
pytest tests/test_workflow.py -v
```

**Test Coverage Highlights:**
- `test_auth_and_persona_login`: Validates JWT token generation and role claims across all 4 system personas.
- `test_public_certificate_verification`: Validates public unauthenticated QR lookup for active certificates.
- `test_public_certificate_expired_and_invalid`: Validates correct handling of expired tokens and tamper alerts.
- `test_end_to_end_statutory_workflow`: Validates the complete 10-step lifecycle: Instrument registration → Application → Review → Scheduling → LMO Assignment → Field inspection → Rule Engine MPE verification → Certificate minting.
- `test_rule_engine_rejection_on_mpe_failure`: Asserts that an inspector cannot issue a certificate if statutory tolerance thresholds are breached.

---

## 7. Documentation Directory

Detailed architectural and regulatory documentation is available in [`docs/`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs):
- [`docs/architecture.md`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs/architecture.md) — System topology, layers, and service separation.
- [`docs/workflow.md`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs/workflow.md) — Complete state machine transition matrix.
- [`docs/database.md`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs/database.md) — ER diagrams and table specifications.
- [`docs/security.md`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs/security.md) — RBAC matrix, token security, and audit ledger.
- [`docs/api.md`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs/api.md) — REST API catalog with request/response schemas.
- [`docs/deployment.md`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs/deployment.md) — Bare-metal and Docker deployment instructions.
- [`docs/legal-rule-configuration.md`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs/legal-rule-configuration.md) — Statutory checklists, MPE rules, and calibration standards.
- [`docs/demo-script.md`](file:///C:/Users/antho/.gemini/antigravity-ide/scratch/legalmet_verify/docs/demo-script.md) — 5-minute evaluator demonstration walkthrough.
