# METRION — REST API Catalog & Integration Guide

**SIH26036:** Development of an Online Verification System for Weighing and Measuring Instruments  
**Base URL:** `http://localhost:8000/api`  
**Interactive Swagger Docs:** `http://localhost:8000/docs`  
**OpenAPI Specification:** `http://localhost:8000/openapi.json`

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@demo.legalmet.local",
    "password": "DemoPass@123"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "admin@demo.legalmet.local",
      "full_name": "R. K. Sharma, Legal Metrology Controller",
      "role": "ADMIN"
    }
  }
  ```

### 1.2 Get Current User Identity
- **Endpoint:** `GET /api/auth/me`
- **Access:** Bearer Token
- **Response (`200 OK`):** User profile object.

---

## 2. Public Verification & Citizen Portal (`/api/public`)

### 2.1 Verify Certificate by QR Token
- **Endpoint:** `GET /api/public/verify/{qr_token}`
- **Access:** Public (No authentication required)
- **Response (`200 OK`):**
  ```json
  {
    "authenticity_status": "VALID",
    "is_authentic": true,
    "certificate_number": "LM-CERT-2026-000001",
    "instrument_id": "LM-INST-000001",
    "instrument_category": "Non-Automatic Weighing Instruments - Class III",
    "manufacturer": "Avery Weigh-Tronix",
    "model": "ZK830-Digital",
    "serial_number_masked": "AW-****-9102",
    "verification_date": "2026-03-15T11:30:00Z",
    "valid_until_date": "2027-03-14T23:59:59Z",
    "status": "VALID",
    "issuing_authority": "Directorate of Legal Metrology, Maharashtra",
    "verifier_role": "Legal Metrology Officer (LMO)",
    "verifier_name": "S. V. Patil",
    "verification_timestamp": "2026-03-15T11:30:00Z",
    "disclaimer": "DEMO CONFIGURATION — NOT A STATUTORY DETERMINATION"
  }
  ```

### 2.2 List Active Instrument Categories
- **Endpoint:** `GET /api/public/categories`
- **Access:** Public
- **Response (`200 OK`):** Array of statutory instrument categories and validity rules.

---

## 3. Instrument Management (`/api/instruments`)

### 3.1 List Instruments
- **Endpoint:** `GET /api/instruments`
- **Access:** Authenticated (Owners see own instruments; Admins/LMOs see district/all)
- **Query Params:** `category_id`, `status`, `search`, `limit`, `offset`

### 3.2 Register New Instrument
- **Endpoint:** `POST /api/instruments`
- **Access:** `INSTRUMENT_OWNER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "category_id": 1,
    "manufacturer": "Essae-Teraoka",
    "model": "DS-252",
    "serial_number": "SN-2026-8841",
    "capacity": "30 kg",
    "accuracy_class": "Class III",
    "year_of_manufacture": 2024,
    "installation_address": "Shop 14, APMC Fruit Market, Vashi",
    "state": "Maharashtra",
    "district": "Navi Mumbai",
    "pincode": "400703"
  }
  ```
- **Response (`201 Created`):** Newly created instrument with assigned `LM-INST-XXXXXX` permanent ID.

---

## 4. Verification Applications (`/api/applications`)

### 4.1 Create Application
- **Endpoint:** `POST /api/applications`
- **Access:** `INSTRUMENT_OWNER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "instrument_id": 1,
    "application_type": "NEW_VERIFICATION",
    "proposed_date": "2026-09-30T10:00:00Z",
    "remarks": "Annual periodic re-verification requested"
  }
  ```

### 4.2 Submit Application
- **Endpoint:** `POST /api/applications/{id}/submit`
- **Access:** `INSTRUMENT_OWNER`
- **Transitions:** `DRAFT` -> `SUBMITTED`

### 4.3 Scrutiny & Review (Admin)
- **Endpoint:** `POST /api/applications/{id}/review`
- **Access:** `ADMIN`
- **Request Body:**
  ```json
  {
    "action": "ACCEPT",
    "review_notes": "Premises and serial number verified compliant with registry."
  }
  ```
- **Transitions:** `SUBMITTED` -> `ACCEPTED` (or `NEEDS_CORRECTION` / `REJECTED`)

---

## 5. Scheduling & Assignment (`/api/schedules`, `/api/assignments`)

### 5.1 Schedule Inspection
- **Endpoint:** `POST /api/schedules`
- **Access:** `ADMIN`
- **Request Body:**
  ```json
  {
    "application_id": 1,
    "scheduled_date": "2026-10-02T10:00:00Z",
    "time_window": "10:00 AM - 01:00 PM",
    "location_address": "Shop 14, APMC Fruit Market, Vashi",
    "notes": "Bring 20kg certified test weights"
  }
  ```

### 5.2 Assign Verifier (LMO / GATC)
- **Endpoint:** `POST /api/assignments`
- **Access:** `ADMIN`
- **Request Body:**
  ```json
  {
    "application_id": 1,
    "assigned_to_type": "OFFICER",
    "assigned_to_user_id": 3
  }
  ```

---

## 6. Field Verification Execution (`/api/verifications`)

### 6.1 Get Dynamic Checklist for Application
- **Endpoint:** `GET /api/verifications/checklist-for-app/{application_id}`
- **Access:** `LMO`, `GATC`, `ADMIN`
- **Behavior:** Automatically transitions application status to `IN_FIELD_VERIFICATION` when opened by the assigned verifier.

### 6.2 Upload Photographic Evidence
- **Endpoint:** `POST /api/verifications/upload-evidence`
- **Access:** `LMO`, `GATC`, `ADMIN`, `INSTRUMENT_OWNER`
- **Content-Type:** `multipart/form-data`
- **Fields:** `application_id`, `file_type` (`PHOTO`, `SEAL_EVIDENCE`, `CALIBRATION_CERT`), `file` (Binary)

### 6.3 Submit Empirical Verification Findings
- **Endpoint:** `POST /api/verifications/submit`
- **Access:** `LMO`, `GATC`
- **Request Body:**
  ```json
  {
    "application_id": 1,
    "rule_version_id": 1,
    "result": "VERIFIED",
    "verifier_remarks": "Zero-load and eccentricity tests within statutory MPE limits. Lead seal stamped.",
    "observations": [
      {
        "checklist_item_id": 1,
        "value_entered": "PASSED",
        "is_compliant": true,
        "remarks": "Display and leveling intact"
      },
      {
        "checklist_item_id": 2,
        "value_entered": "0.1",
        "unit": "g",
        "is_compliant": true,
        "remarks": "MPE within ±0.5g at half capacity"
      }
    ]
  }
  ```
- **Response:** Automatically issues statutory PDF certificate if compliant, transitions state machine, and triggers notifications.
