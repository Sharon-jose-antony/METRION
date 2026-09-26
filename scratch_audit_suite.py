import urllib.request
import urllib.parse
import urllib.error
import json
import sys
import os
import uuid
import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://localhost:8000/api"

def http_req(method, endpoint, data=None, token=None, headers_extra=None, is_json=True):
    url = f"{BASE_URL}{endpoint}" if endpoint.startswith("/") else endpoint
    headers = {}
    if is_json:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if headers_extra:
        headers.update(headers_extra)
    
    body = None
    if data is not None:
        if is_json:
            body = json.dumps(data).encode("utf-8")
        elif isinstance(data, bytes):
            body = data
        elif isinstance(data, str):
            body = data.encode("utf-8")
            
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read()
            c_type = resp.headers.get("Content-Type", "")
            if "application/json" in c_type:
                try:
                    return resp.status, json.loads(content.decode("utf-8")), resp.headers
                except:
                    return resp.status, content, resp.headers
            else:
                return resp.status, content, resp.headers
    except urllib.error.HTTPError as e:
        content = e.read()
        try:
            return e.code, json.loads(content.decode("utf-8")), e.headers
        except:
            return e.code, {"detail": content.decode("utf-8", errors="ignore")}, e.headers
    except Exception as e:
        return 0, {"detail": str(e)}, {}

def run_audit():
    results = {}
    
    print("=== STARTING RIGOROUS DEEP AUDIT FOR METRION ===")
    
    # 1. Login all personas
    personas = {
        "admin": ("admin@demo.legalmet.local", "DemoPass@123"),
        "owner": ("owner@demo.legalmet.local", "DemoPass@123"),
        "lmo": ("lmo@demo.legalmet.local", "DemoPass@123"),
        "gatc": ("gatc@demo.legalmet.local", "DemoPass@123"),
    }
    tokens = {}
    for role, (email, pwd) in personas.items():
        status, body, _ = http_req("POST", "/auth/login", {"email": email, "password": pwd})
        if status == 200:
            tokens[role] = body["access_token"]
            results[f"login_{role}"] = "PASS"
        else:
            results[f"login_{role}"] = f"FAIL ({status})"
    print(f"1. Persona logins: {results}")

    # 2. Test registration security defect: Can anyone register as ADMIN?
    test_admin_email = f"test_admin_{uuid.uuid4().hex[:6]}@exploit.test"
    status, body, _ = http_req("POST", "/auth/register", {
        "full_name": "Injected Admin",
        "email": test_admin_email,
        "password": "Password123!",
        "role": "ADMIN",
        "organization_name": "Exploit Org"
    })
    if status == 200 and body.get("user", {}).get("role") == "ADMIN":
        results["privilege_escalation_registration"] = "VULNERABLE (Allows public ADMIN registration)"
        injected_token = body["access_token"]
        status_dash, _, _ = http_req("GET", "/dashboard/admin", token=injected_token)
        results["injected_admin_access"] = f"ACCESSED ({status_dash})"
    else:
        results["privilege_escalation_registration"] = f"PROTECTED ({status})"
    print(f"2. Registration Privilege Escalation: {results.get('privilege_escalation_registration')}")

    # 3. Test RBAC on direct API calls
    code, _, _ = http_req("GET", "/dashboard/admin", token=tokens["owner"])
    results["rbac_owner_to_admin_dashboard"] = code
    
    code, _, _ = http_req("GET", "/audit-events", token=tokens["owner"])
    results["rbac_owner_to_audit_events"] = code

    code, _, _ = http_req("POST", "/schedules", {"application_id": 1}, token=tokens["owner"])
    results["rbac_owner_to_schedules"] = code

    code, _, _ = http_req("POST", "/verifications/submit", {"application_id": 1}, token=tokens["owner"])
    results["rbac_owner_to_verification_submit"] = code

    code, _, _ = http_req("GET", "/dashboard/admin", token=tokens["lmo"])
    results["rbac_lmo_to_admin_dashboard"] = code

    code, _, _ = http_req("GET", "/dashboard/admin", token=tokens["gatc"])
    results["rbac_gatc_to_admin_dashboard"] = code

    code, _, _ = http_req("POST", "/certificates/1/revoke", {"revocation_reason": "test"}, token=tokens["lmo"])
    results["rbac_lmo_to_revoke_cert"] = code

    print(f"3. Direct RBAC matrix: {results}")

    # 4. Cross-owner data isolation (Horizontal Privilege Escalation)
    owner2_email = f"owner2_{uuid.uuid4().hex[:6]}@test.local"
    status_o2, body_o2, _ = http_req("POST", "/auth/register", {
        "full_name": "Second Owner",
        "email": owner2_email,
        "password": "Password123!",
        "role": "INSTRUMENT_OWNER",
        "organization_name": "Second Org"
    })
    token_owner2 = body_o2["access_token"]

    status_inst, insts, _ = http_req("GET", "/instruments", token=tokens["owner"])
    if insts:
        inst_owner1 = insts[0]["id"]
        code_inst, body_i, _ = http_req("GET", f"/instruments/{inst_owner1}", token=token_owner2)
        results["horizontal_priv_instrument_view"] = code_inst
        
        code_app_hack, body_ah, _ = http_req("POST", "/applications", {
            "instrument_id": inst_owner1,
            "application_type": "NEW_VERIFICATION"
        }, token=token_owner2)
        results["horizontal_priv_app_create"] = code_app_hack
    print(f"4. Horizontal Isolation: inst_view={results.get('horizontal_priv_instrument_view')}, app_create={results.get('horizontal_priv_app_create')}")

    # 5. Unauthenticated Certificate PDF access check
    status_pdf, body_pdf, headers_pdf = http_req("GET", "/certificates/1/pdf")
    results["unauth_cert_pdf_access"] = status_pdf
    if status_pdf == 200 and isinstance(body_pdf, bytes) and body_pdf.startswith(b"%PDF"):
        results["unauth_cert_pdf_is_valid_pdf"] = True
    else:
        results["unauth_cert_pdf_is_valid_pdf"] = False
    print(f"5. Certificate PDF access: status={status_pdf}, valid_pdf={results.get('unauth_cert_pdf_is_valid_pdf')}")

    # 6. Workflow state machine invalid transitions
    code_owner_rev, _, _ = http_req("POST", "/applications/1/review", {"status": "VERIFIED"}, token=tokens["owner"])
    results["invalid_transition_owner_review"] = code_owner_rev
    
    status_cat, cats, _ = http_req("GET", "/instruments/categories", token=tokens["owner"])
    cat_id = cats[0]["id"]
    _, new_inst, _ = http_req("POST", "/instruments", {
        "category_id": cat_id,
        "manufacturer": "Audit Scale",
        "model": "Mod-A",
        "serial_number": f"SN-{uuid.uuid4().hex[:8]}",
        "installation_address": "Test Station"
    }, token=tokens["owner"])
    inst_db_id = new_inst["id"]
    
    _, new_app, _ = http_req("POST", "/applications", {
        "instrument_id": inst_db_id,
        "application_type": "NEW_VERIFICATION"
    }, token=tokens["owner"])
    app_db_id = new_app["id"]

    code_illegal, body_illegal, _ = http_req("POST", f"/applications/{app_db_id}/review", {
        "status": "VERIFIED"
    }, token=tokens["admin"])
    results["illegal_transition_submitted_to_verified"] = (code_illegal, body_illegal.get("detail", ""))
    print(f"6. Illegal transition test: {results.get('illegal_transition_submitted_to_verified')}")

    # 7. File Upload Evidence Tests
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex[:16]}"
    body_multipart = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="application_id"\r\n\r\n'
        f"{app_db_id}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file_type"\r\n\r\n'
        f"PHOTO\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test_scale.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
        f"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\xFF\xD9\r\n"
        f"--{boundary}--\r\n"
    ).encode("latin1")
    code_up, body_up, _ = http_req("POST", "/verifications/upload-evidence", 
                                   data=body_multipart, 
                                   token=tokens["lmo"], 
                                   headers_extra={"Content-Type": f"multipart/form-data; boundary={boundary}"}, 
                                   is_json=False)
    results["valid_photo_upload"] = code_up

    body_bad = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="application_id"\r\n\r\n'
        f"{app_db_id}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file_type"\r\n\r\n'
        f"PHOTO\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="malicious.exe"\r\n'
        f"Content-Type: application/x-msdownload\r\n\r\n"
        f"MZ9000fakeexe\r\n"
        f"--{boundary}--\r\n"
    ).encode("latin1")
    code_bad_up, body_bad_up, _ = http_req("POST", "/verifications/upload-evidence", 
                                           data=body_bad, 
                                           token=tokens["lmo"], 
                                           headers_extra={"Content-Type": f"multipart/form-data; boundary={boundary}"}, 
                                           is_json=False)
    results["invalid_ext_upload"] = (code_bad_up, body_bad_up.get("detail", ""))
    print(f"7. File upload: valid={code_up}, bad_ext={results.get('invalid_ext_upload')}")

    # 8. Complete Verification and Re-verification Test
    lmo_users = http_req("GET", "/users?role=LMO", token=tokens["admin"])[1]
    lmo_id = lmo_users[0]["id"]
    http_req("POST", "/schedules", {
        "application_id": app_db_id,
        "scheduled_date": "2026-10-10T10:00:00",
        "time_window": "10:00 AM - 01:00 PM",
        "location_address": "Test Station",
        "assign_to_type": "LMO",
        "assigned_to_user_id": lmo_id
    }, token=tokens["admin"])

    _, chk_data, _ = http_req("GET", f"/verifications/checklist-for-app/{app_db_id}", token=tokens["lmo"])
    obs = []
    for itm in chk_data["items"]:
        obs.append({
            "checklist_item_id": itm["id"],
            "value_entered": "Pass" if itm["field_type"] == "BOOLEAN" else "0.5",
            "unit": itm["unit"],
            "is_compliant": True,
            "remarks": "Verified"
        })
    code_sub, verif_res, _ = http_req("POST", "/verifications/submit", {
        "application_id": app_db_id,
        "rule_version_id": chk_data["rule_version_id"],
        "result": "VERIFIED",
        "verifier_remarks": "Passed all tests",
        "observations": obs,
        "geo_latitude": 28.6,
        "geo_longitude": 77.2
    }, token=tokens["lmo"])
    
    cert_id = verif_res.get("certificate_id")
    results["first_verification_submit"] = code_sub
    results["first_cert_id"] = cert_id

    code_reverif, body_reverif, _ = http_req("POST", "/applications", {
        "instrument_id": inst_db_id,
        "application_type": "RE_VERIFICATION",
        "remarks": "Periodic statutory re-verification"
    }, token=tokens["owner"])
    results["reverification_submission"] = code_reverif
    if code_reverif in (200, 201):
        results["reverification_app_number"] = body_reverif.get("application_number")
        results["reverification_instrument_perm_id"] = body_reverif.get("instrument_permanent_id")
        results["same_instrument_id_preserved"] = (body_reverif.get("instrument_permanent_id") == new_inst["instrument_id"])
    print(f"8. Re-verification: status={code_reverif}, preserved={results.get('same_instrument_id_preserved')}")

    # 9. Audit trail tamper resistance
    code_audit_del, _, _ = http_req("DELETE", "/audit-events", token=tokens["admin"])
    results["audit_delete_allowed"] = code_audit_del
    code_audit_post, _, _ = http_req("POST", "/audit-events", {"action": "FAKE"}, token=tokens["admin"])
    results["audit_post_allowed"] = code_audit_post
    print(f"9. Audit tamper resistance: del={code_audit_del}, post={code_audit_post}")

    # 10. Dashboard Live DB Queries verification (change count)
    code_dash_b4, body_dash_b4, _ = http_req("GET", "/dashboard/admin", token=tokens["admin"])
    inst_count_b4 = body_dash_b4["metrics"]["total_instruments"]
    
    # Register another instrument
    http_req("POST", "/instruments", {
        "category_id": cat_id,
        "manufacturer": "Counter Test",
        "model": "Mod-B",
        "serial_number": f"SN-{uuid.uuid4().hex[:8]}",
        "installation_address": "Test Station"
    }, token=tokens["owner"])
    
    code_dash_af, body_dash_af, _ = http_req("GET", "/dashboard/admin", token=tokens["admin"])
    inst_count_af = body_dash_af["metrics"]["total_instruments"]
    results["dashboard_is_live_db_query"] = (inst_count_af == inst_count_b4 + 1)
    print(f"10. Dashboard live query test: before={inst_count_b4}, after={inst_count_af}, is_live={results.get('dashboard_is_live_db_query')}")

    print("\n=== FINAL AUDIT RESULT DICTIONARY ===")
    for k, v in results.items():
        print(f"  * {k}: {v}")

if __name__ == "__main__":
    run_audit()
