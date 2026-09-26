import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.seed import DEMO_PASSWORD

client = TestClient(app)

def login(email: str, password: str = DEMO_PASSWORD):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    data = response.json()
    return data["access_token"], data["user"]

def test_auth_all_roles():
    for email in ["admin@demo.legalmet.local", "owner@demo.legalmet.local", "lmo@demo.legalmet.local", "gatc@demo.legalmet.local"]:
        token, user = login(email)
        assert token is not None
        assert user["email"] == email

def test_public_qr_verification_valid():
    # Token for LM-CERT-2026-000001 is a1b2c3d4e5f67890abcdef1234567890
    response = client.get("/api/public/certificates/verify/a1b2c3d4e5f67890abcdef1234567890")
    assert response.status_code == 200
    data = response.json()
    assert data["is_authentic"] is True
    assert data["authenticity_status"] == "VALID"
    assert data["certificate_number"] == "LM-CERT-2026-000001"
    assert data["instrument_id"] == "LM-INST-000001"
    assert "owner" not in data  # Privacy protection: no private owner details exposed

def test_public_qr_verification_expired():
    # Token for LM-CERT-2025-000109 is c3d4e5f6a1b27890abcdef1234567892
    response = client.get("/api/public/certificates/verify/c3d4e5f6a1b27890abcdef1234567892")
    assert response.status_code == 200
    data = response.json()
    assert data["authenticity_status"] == "EXPIRED"

def test_public_qr_verification_invalid():
    response = client.get("/api/public/certificates/verify/non_existent_token_123")
    assert response.status_code == 404

def test_end_to_end_verification_workflow():
    # 1. Owner registers an instrument
    owner_token, _ = login("owner@demo.legalmet.local")
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    
    # Get NAWI category ID
    cat_res = client.get("/api/instruments/categories", headers=owner_headers)
    assert cat_res.status_code == 200
    categories = cat_res.json()
    nawi_cat = next(c for c in categories if c["code"] == "NAWI")

    import uuid
    test_serial = f"TEST-SN-{uuid.uuid4().hex[:6]}"
    inst_payload = {
        "category_id": nawi_cat["id"],
        "manufacturer": "Cas Scale Corp",
        "model": "SW-10 Countertop Scale",
        "serial_number": test_serial,
        "capacity": "15 kg",
        "accuracy_class": "Class III (Medium)",
        "year_of_manufacture": 2025,
        "installation_address": "Test Station 5, Delhi Retail Depo",
        "state": "Delhi",
        "district": "Central Delhi",
        "pincode": "110005"
    }
    create_inst_res = client.post("/api/instruments", json=inst_payload, headers=owner_headers)
    assert create_inst_res.status_code == 200
    inst_data = create_inst_res.json()
    inst_id = inst_data["id"]
    perm_id = inst_data["instrument_id"]
    assert perm_id.startswith("LM-INST-")

    # 2. Owner submits verification application
    app_payload = {
        "instrument_id": inst_id,
        "application_type": "NEW_VERIFICATION",
        "remarks": "End-to-end statutory verification test application"
    }
    app_res = client.post("/api/applications", json=app_payload, headers=owner_headers)
    assert app_res.status_code == 200
    app_data = app_res.json()
    app_id = app_data["id"]
    assert app_data["status"] == "SUBMITTED"

    # 3. Admin logs in, reviews and schedules verification, assigning to LMO
    admin_token, _ = login("admin@demo.legalmet.local")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Get LMO user id
    lmo_users = client.get("/api/users?role=LMO", headers=admin_headers).json()
    lmo_user = lmo_users[0]

    schedule_payload = {
        "application_id": app_id,
        "scheduled_date": "2026-10-01T10:00:00Z",
        "time_window": "10:00 AM - 01:00 PM",
        "location_address": "Test Station 5, Delhi Retail Depo",
        "notes": "End-to-end integration test schedule",
        "assign_to_type": "LMO",
        "assigned_to_user_id": lmo_user["id"]
    }
    sched_res = client.post("/api/schedules", json=schedule_payload, headers=admin_headers)
    assert sched_res.status_code == 200

    # 4. LMO logs in, views checklist and begins field verification
    lmo_token, _ = login("lmo@demo.legalmet.local")
    lmo_headers = {"Authorization": f"Bearer {lmo_token}"}

    chk_res = client.get(f"/api/verifications/checklist-for-app/{app_id}", headers=lmo_headers)
    assert chk_res.status_code == 200
    chk_data = chk_res.json()
    assert len(chk_data["items"]) > 0

    # Prepare observations
    observations = []
    for itm in chk_data["items"]:
        val = "Pass" if itm["field_type"] == "BOOLEAN" else "0.5"
        observations.append({
            "checklist_item_id": itm["id"],
            "value_entered": val,
            "unit": itm["unit"],
            "is_compliant": True,
            "remarks": "Verified compliant during integration test"
        })

    # 5. LMO submits field verification result: VERIFIED
    submit_payload = {
        "application_id": app_id,
        "rule_version_id": chk_data["rule_version_id"],
        "result": "VERIFIED",
        "verifier_remarks": "Integration test verified successfully.",
        "observations": observations,
        "geo_latitude": 28.6139,
        "geo_longitude": 77.2090
    }
    verif_res = client.post("/api/verifications/submit", json=submit_payload, headers=lmo_headers)
    assert verif_res.status_code == 200
    verif_data = verif_res.json()
    assert verif_data["result"] == "VERIFIED"
    assert verif_data["certificate_id"] is not None
    cert_id = verif_data["certificate_id"]

    # 6. Verify certificate details & PDF download
    cert_res = client.get(f"/api/certificates/{cert_id}", headers=owner_headers)
    assert cert_res.status_code == 200
    cert_data = cert_res.json()
    assert cert_data["status"] == "VALID"
    qr_token = cert_data["qr_token"]

    pdf_res = client.get(f"/api/certificates/{cert_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"

    # 7. Public scans QR code and verifies certificate
    public_res = client.get(f"/api/public/certificates/verify/{qr_token}")
    assert public_res.status_code == 200
    pub_data = public_res.json()
    assert pub_data["is_authentic"] is True
    assert pub_data["authenticity_status"] == "VALID"
    assert pub_data["certificate_number"] == cert_data["certificate_number"]

    # 8. Check instrument lifecycle history
    hist_res = client.get(f"/api/instruments/{inst_id}/history", headers=owner_headers)
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert len(hist_data["timeline"]) >= 4  # Registered, App Created, Scheduled, Verified, Cert Issued

    # 9. Admin revokes certificate with reason
    revoke_res = client.post(
        f"/api/certificates/{cert_id}/revoke",
        json={"revocation_reason": "Automated security test revocation verification"},
        headers=admin_headers
    )
    assert revoke_res.status_code == 200
    assert revoke_res.json()["status"] == "REVOKED"

    # 10. Public verification now shows REVOKED
    public_revoked = client.get(f"/api/public/certificates/verify/{qr_token}")
    assert public_revoked.status_code == 200
    assert public_revoked.json()["authenticity_status"] == "REVOKED"
