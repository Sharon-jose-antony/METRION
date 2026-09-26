# METRION — Security, Privacy & Compliance Architecture

**SIH26036:** Development of an Online Verification System for Weighing and Measuring Instruments

---

## 1. Security Principles

METRION is built around core government and enterprise security standards:
1. **Zero-Trust Role-Based Access Control (RBAC):** Every endpoint enforces strict identity and role claims before evaluating domain logic.
2. **Deterministic Cryptographic Hashing:** Certificates are signed with internal SHA-256 integrity digests; passwords use industry-standard salted bcrypt.
3. **Public Privacy Protection (PII Safeguards):** Field QR verification exposes certificate validity and technical compliance without leaking the owner's personal telephone number, Aadhaar/PAN, or exact manufacturing cost.
4. **Append-Only Immutable Audit Trail:** All administrative decisions, status shifts, certificate issuances, and evidence uploads are recorded in an unalterable ledger.

---

## 2. Authentication & Authorization Architecture

### 2.1 Identity & Session Tokens
- **Mechanism:** OAuth2 Bearer Tokens with JSON Web Tokens (JWT).
- **Algorithm:** HMAC-SHA256 (`HS256`) signed via secure server secret.
- **Payload:** Contains `sub` (User Email), `role` (`ADMIN`, `INSTRUMENT_OWNER`, `LMO`, `GATC`), `user_id`, and `exp`.
- **Token Lifetime:** Configurable (Default: 480 minutes / 8 hours for operational shifts).

### 2.2 Role-Based Access Control (RBAC) Matrix

| Endpoint Group | `ADMIN` | `INSTRUMENT_OWNER` | `LMO` (Officer) | `GATC` (Agency) | Public / Citizen |
|---|---|---|---|---|---|
| Register / Login | Yes | Yes | Yes | Yes | Open |
| Public Certificate Verify (`/api/public/verify/*`) | Open | Open | Open | Open | Open |
| Register Instrument | Full | Own Org Only | Read-Only | Read-Only | Denied |
| Submit Application | Full | Own Org Only | Denied | Denied | Denied |
| Scrutiny & Acceptance | Full | Denied | Denied | Denied | Denied |
| Schedule & Assign Verifier | Full | Denied | Denied | Denied | Denied |
| Open Field Case & Enter Checklist | Full | Denied | Assigned Only | Assigned Only | Denied |
| Upload Inspection Evidence | Full | Own Apps Only | Assigned Only | Assigned Only | Denied |
| Submit Verification Outcome | Full | Denied | Assigned Only | Assigned Only | Denied |
| Generate / Download Certificate | Full | Own Org Only | Assigned Only | Assigned Only | Verified Token Only |
| Audit Logs & Rule Configuration | Full | Denied | Denied | Denied | Denied |

---

## 3. Cryptographic Implementation Details

### 3.1 Password Hashing
- **Modern Direct Bcrypt:** Implemented via direct `bcrypt.hashpw` and `bcrypt.checkpw` with high-workfactor random salt generation (`bcrypt.gensalt()`).
- Avoids fragile wrapper libraries that fail across evolving Python versions.

### 3.2 Certificate Integrity Digest
- When an instrument is marked `VERIFIED`, `certificate_service.py` calculates an immutable SHA-256 digest over the critical statutory tuple:
  ```
  Digest = SHA-256(CertificateNumber + InstrumentPermanentID + VerifierID + VerificationTimestamp + ValidUntilDate)
  ```
- This digest is stored in `certificates.security_hash` and printed as a micro-line reference on the physical certificate.

---

## 4. Public Verification & Privacy Protection

When a QR code on an instrument is scanned by an enforcement officer or consumer:
1. **Lookup via Opaque QR Token:** The scanner calls `/api/public/verify/{qr_token}`. The internal database ID is not revealed.
2. **Serial Number Masking:** The serial number is partially obfuscated (e.g. `WB-****-8812`) to prevent industrial counter-fitting of physical stamping plates.
3. **No Private Contact Leakage:** The response excludes owner phone numbers, personal home addresses, and administrative notes.
4. **Official Authority & Officer Disclosure:** Clearly displays the authorized issuing directorate, the verifying officer's official name, and statutory validity dates.

---

## 5. File Upload & Storage Security

All photographic evidence and calibration records are validated through strict server-side controls:
- **Whitelisted File Extensions:** Only `.jpg`, `.jpeg`, `.png`, `.webp`, and `.pdf` are permitted. Executables, scripts, and unknown formats are rejected (`HTTP 400`).
- **Filename Sanitization & Randomization:** Files are renamed with UUIDs (`evidence_{app_id}_{uuid}.ext`) to eliminate path traversal vulnerabilities (`../../`).
- **Storage Isolation:** Uploads reside in dedicated static folders (`uploads/`) with sandboxed access.

---

## 6. Audit Trail Architecture

The `audit_events` table maintains an immutable historical ledger tracking:
- `user_id` / `user_email` / `user_role`
- `action` (e.g. `STATUS_CHANGE_ACCEPTED`, `VERIFICATION_SUBMITTED`, `CERTIFICATE_ISSUED`)
- `entity_type` and `entity_id`
- `description` with human-readable rationale
- `created_at` (UTC timestamp)

Audit records cannot be modified or deleted via standard API routes.
