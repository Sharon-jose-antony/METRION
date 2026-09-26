# METRION — Deployment & Operations Guide

**SIH26036:** Development of an Online Verification System for Weighing and Measuring Instruments

---

## 1. Prerequisites

### Local Development Environment
- **Operating System:** Windows, Linux, or macOS.
- **Python:** Version 3.10+ (Python 3.11 recommended).
- **Node.js:** Version 18+ or 20+ (with `npm`).
- **Git:** Standard git client.

### Containerized Environment
- **Docker:** Version 24.0+
- **Docker Compose:** Version 2.20+

---

## 2. Option A: Local Bare-Metal Setup (Fastest for Evaluation)

### Step 1: Clone and Enter Directory
```bash
cd C:\Users\antho\.gemini\antigravity-ide\scratch\legalmet_verify
```

### Step 2: Backend Setup & Seed
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run seed script (creates tables, loads categories, users, test data, and sample certificates)
python -m app.seed

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### Step 3: Frontend Setup & Start (New Terminal Window)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
The frontend is now available at `http://localhost:5173`.

---

## 3. Option B: Docker Compose Deployment

A single command builds and starts the full-stack container environment:

```bash
docker-compose up --build -d
```

- **Frontend Application:** `http://localhost:3000`
- **Backend API & Swagger:** `http://localhost:8000/docs`
- **Healthcheck Endpoint:** `http://localhost:8000/api/public/categories`

To view logs:
```bash
docker-compose logs -f backend
```

To stop containers:
```bash
docker-compose down
```

---

## 4. Verification & Health Check

Run the automated test suite to confirm end-to-end statutory workflow compliance:

```bash
cd backend
pytest tests/test_workflow.py -v
```

Expected output:
```
tests/test_workflow.py::test_auth_and_persona_login PASSED
tests/test_workflow.py::test_public_certificate_verification PASSED
tests/test_workflow.py::test_public_certificate_expired_and_invalid PASSED
tests/test_workflow.py::test_end_to_end_statutory_workflow PASSED
tests/test_workflow.py::test_rule_engine_rejection_on_mpe_failure PASSED
========================= 5 passed in 2.30s =========================
```

---

## 5. Production Hardening Checklist

When transitioning from SIH prototype to state-level production:
1. **Database:** Switch `DATABASE_URL` from SQLite to managed PostgreSQL (e.g. AWS RDS or GCP Cloud SQL) with connection pooling (`pool_size=20`).
2. **Secrets:** Change `SECRET_KEY` to a 64-character cryptographically random token stored in a KMS / Vault.
3. **HTTPS / TLS:** Terminate TLS using Let's Encrypt or AWS ACM in front of Nginx.
4. **Certificate Signatures:** Integrate DSC (Digital Signature Certificate) hardware tokens / HSM for PKI-based signing of generated PDFs.
5. **Storage:** Map `STORAGE_DIR` to an S3/GCS bucket with bucket-level encryption (SSE-KMS).
