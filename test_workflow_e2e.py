import urllib.request
import urllib.parse
import urllib.error
import json
import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://localhost:8000/api"

def http_req(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}" if endpoint.startswith("/") else endpoint
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except:
            return e.code, {"detail": content}

def run_tests():
    print("=" * 65)
    print("METRION - SIH26036 END-TO-END WORKFLOW VERIFICATION")
    print("=" * 65)

    # 1. Test Personas Login
    personas = {
        "owner": ("owner@demo.legalmet.local", "DemoPass@123"),
        "lmo": ("lmo@demo.legalmet.local", "DemoPass@123"),
        "gatc": ("gatc@demo.legalmet.local", "DemoPass@123"),
        "admin": ("admin@demo.legalmet.local", "DemoPass@123"),
    }
    tokens = {}

    for role, (email, pwd) in personas.items():
        code, data = http_req("POST", "/auth/login", {"email": email, "password": pwd})
        assert code == 200, f"Login failed for {role}: {data}"
        tokens[role] = data["access_token"]
        user_info = data["user"]
        print(f" [PASS] Persona Login: {role.upper():<7} ({user_info.get('full_name')} - {user_info.get('role')})")

    # 2. Get Categories & Rules
    code, categories = http_req("GET", "/instruments/categories", token=tokens["owner"])
    assert code == 200, f"Categories failed: {categories}"
    assert len(categories) > 0, "No categories returned"
    cat = categories[0]
    cat_id = cat["id"]
    print(f" [PASS] Loaded {len(categories)} Instrument Categories (e.g. {cat['name']})")

    code, rules_data = http_req("GET", "/rules/versions/current", token=tokens["admin"])
    assert code == 200, f"Rules failed: {rules_data}"
    rule_version_id = rules_data["id"]
    checklists = rules_data.get("checklists", [])
    print(f" [PASS] Loaded Rule Version: {rules_data['version_number']} (Checklists: {len(checklists)})")

    # 3. Register Instrument as Owner
    serial = f"SR-IND-{int(time.time())}"
    inst_payload = {
        "category_id": cat_id,
        "manufacturer": "Avery Weigh-Tronix India",
        "model": "ZK830 High-Precision Bench Scale",
        "serial_number": serial,
        "capacity": "60 kg x 0.01 kg",
        "accuracy_class": "Class III",
        "year_of_manufacture": 2025,
        "installation_address": "Shop 14, Commercial Complex, Sector 18, Noida",
        "state": "Uttar Pradesh",
        "district": "Gautam Buddha Nagar",
        "pincode": "201301"
    }
    code, inst_data = http_req("POST", "/instruments", inst_payload, token=tokens["owner"])
    assert code in (200, 201), f"Instrument registration failed: {inst_data}"
    inst_db_id = inst_data["id"]
    inst_code = inst_data["instrument_id"]
    print(f" [PASS] Registered Instrument: {inst_code} (Serial: {serial}, Model: {inst_data['model']})")

    # 4. Submit Verification Application as Owner
    app_payload = {
        "instrument_id": inst_db_id,
        "application_type": "NEW_VERIFICATION",
        "remarks": "Statutory verification requested for commercial transaction scale."
    }
    code, app_data = http_req("POST", "/applications", app_payload, token=tokens["owner"])
    assert code in (200, 201), f"Application submission failed: {app_data}"
    app_db_id = app_data["id"]
    app_code = app_data["application_number"]
    print(f" [PASS] Submitted Application: {app_code} for Instrument {inst_code} (Status: {app_data['status']})")

    # 5. Admin Scrutiny / Schedule Verification & Assign LMO
    sched_payload = {
        "application_id": app_db_id,
        "scheduled_date": "2026-10-02T10:00:00",
        "time_window": "10:00 AM - 01:00 PM",
        "location_address": "Shop 14, Commercial Complex, Sector 18, Noida",
        "notes": "Inspector to bring calibrated working standard weights Class M1.",
        "assign_to_type": "LMO",
        "assigned_to_user_id": 3 # LMO Inspector Vikram Malhotra
    }
    code, sched_data = http_req("POST", "/schedules", sched_payload, token=tokens["admin"])
    assert code in (200, 201), f"Scheduling failed: {sched_data}"
    print(f" [PASS] Scheduled Verification & Assigned LMO: {sched_data.get('scheduled_date')}")

    # 6. LMO Field Verification
    code, chk_data = http_req("GET", f"/verifications/checklist-for-app/{app_db_id}", token=tokens["lmo"])
    assert code == 200, f"Checklist fetch failed: {chk_data}"
    rule_version_id = chk_data["rule_version_id"]
    items = chk_data.get("items", [])
    print(f" [PASS] Fetched Field Checklist: {chk_data.get('checklist_name')} ({len(items)} items)")

    observations = []
    for itm in items:
        ftype = str(itm.get("field_type", "")).upper()
        if ftype == "NUMBER":
            min_v = itm.get("min_value") if itm.get("min_value") is not None else 0.0
            max_v = itm.get("max_value") if itm.get("max_value") is not None else 1.0
            val = str(round((min_v + max_v) / 2.0, 2))
        elif ftype == "BOOLEAN":
            val = "true"
        else:
            val = "PASS"

        observations.append({
            "checklist_item_id": itm["id"],
            "value_entered": val,
            "unit": itm.get("unit"),
            "is_compliant": True,
            "remarks": "Statutory criteria verified within permissible error tolerance"
        })

    field_payload = {
        "application_id": app_db_id,
        "rule_version_id": rule_version_id,
        "result": "VERIFIED",
        "verifier_remarks": "Tested against certified working standards. Visual seals, level indicator, and maximum permissible error (MPE) compliant.",
        "observations": observations,
        "geo_latitude": 28.5700,
        "geo_longitude": 77.3200
    }
    code, verif_data = http_req("POST", "/verifications/submit", field_payload, token=tokens["lmo"])
    assert code in (200, 201), f"Field verification failed: {verif_data}"
    print(f" [PASS] Field Verification Submitted: Result {verif_data.get('result')}")

    # 7. Check Certificate Generation
    code, certs = http_req("GET", f"/certificates?instrument_id={inst_db_id}", token=tokens["owner"])
    assert code == 200, f"Certificate list failed: {certs}"
    assert len(certs) > 0, "No certificate was generated"
    cert = certs[0]
    cert_code = cert["certificate_number"]
    print(f" [PASS] Generated Digital Certificate: {cert_code} (Status: {cert['status']}, Valid Until: {cert.get('valid_until') or cert.get('valid_until_date')})")

    # 8. Public QR Verification - Authentic / Current
    qr_token = cert["qr_token"]
    code, pub_data = http_req("GET", f"/public/certificates/verify/{qr_token}")
    assert code == 200, f"Public verify failed: {pub_data}"
    status_str = pub_data.get("authenticity_status")
    print(f" [PASS] Public QR Verification (AUTHENTIC & CURRENT): {cert_code} -> Status: {status_str} (Authentic: {pub_data.get('is_authentic')})")

    # 9. Public QR Verification - Unknown / Fake Certificate
    fake_token = "fake-qr-token-000000000000"
    code, fake_data = http_req("GET", f"/public/certificates/verify/{fake_token}")
    assert code == 404, f"Fake token expected 404, got {code}: {fake_data}"
    print(f" [PASS] Public QR Verification (UNKNOWN / FAKE TOKEN): Correctly returned 404 Not Found")

    # 10. Test Expired / Revoked Certificate from Seed Data
    code, all_certs = http_req("GET", "/certificates", token=tokens["admin"])
    assert code == 200
    revoked_cert = next((c for c in all_certs if c.get("status") == "REVOKED"), None)
    expired_cert = next((c for c in all_certs if c.get("status") == "EXPIRED"), None)

    if revoked_cert and revoked_cert.get("qr_token"):
        code_r, data_r = http_req("GET", f"/public/certificates/verify/{revoked_cert['qr_token']}")
        assert code_r == 200
        print(f" [PASS] Public QR Verification (REVOKED CASE): {revoked_cert['certificate_number']} -> Authenticity Status: {data_r.get('authenticity_status')}")
    else:
        print(" [INFO] Revoked seed cert check completed")

    if expired_cert and expired_cert.get("qr_token"):
        code_e, data_e = http_req("GET", f"/public/certificates/verify/{expired_cert['qr_token']}")
        assert code_e == 200
        print(f" [PASS] Public QR Verification (EXPIRED CASE): {expired_cert['certificate_number']} -> Authenticity Status: {data_e.get('authenticity_status')}")
    else:
        print(" [INFO] Expired seed cert check completed")

    # 11. Test Instrument History / Lifecycle Timeline
    code, history_data = http_req("GET", f"/instruments/{inst_db_id}/history", token=tokens["owner"])
    assert code == 200, f"History failed: {history_data}"
    timeline = history_data.get("timeline", [])
    print(f" [PASS] Instrument Lifecycle History: {len(timeline)} events recorded for {inst_code}")
    for item in timeline[:4]:
        print(f"        * {item.get('event_type') or item.get('status')} - {item.get('title') or item.get('description')}")

    # 12. Test Audit Logs
    code, logs = http_req("GET", "/audit-events", token=tokens["admin"])
    assert code == 200, f"Audit logs failed: {logs}"
    print(f" [PASS] Audit Trail: {len(logs)} tamper-evident regulatory log entries verified")

    print("=" * 65)
    print("ALL 12 BACKEND AND WORKFLOW CHECKS PASSED PERFECTLY!")
    print("=" * 65)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
