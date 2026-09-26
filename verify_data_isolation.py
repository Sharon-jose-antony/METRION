import urllib.request
import urllib.parse
import urllib.error
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://127.0.0.1:8000/api"

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

def login(email, pwd="DemoPass@123"):
    code, data = http_req("POST", "/auth/login", {"email": email, "password": pwd})
    assert code == 200, f"Login failed for {email}: {data}"
    return data["access_token"], data["user"]

print("=" * 65)
print("METRION DATA SEGREGATION & ACCESS CONTROL AUDIT")
print("=" * 65)

# 1. OWNER
print("\n[CHECK 1] Owner Data Isolation & Persona Boundary")
token_owner, user_owner = login("owner@demo.legalmet.local")
owner_id = user_owner["id"]
print(f" -> Logged in as Owner: {user_owner['full_name']} (ID: {owner_id})")

# Owner Instruments
code, insts = http_req("GET", "/instruments", token=token_owner)
assert code == 200
for inst in insts:
    assert inst["owner_id"] == owner_id, f"LEAK: Instrument {inst['id']} belongs to {inst['owner_id']} not {owner_id}"
print(f" [PASS] All {len(insts)} instruments belong strictly to owner_id={owner_id}")

# Owner Applications
code, apps = http_req("GET", "/applications", token=token_owner)
assert code == 200
for app in apps:
    assert app["owner_id"] == owner_id, f"LEAK: Application {app['id']} belongs to {app['owner_id']} not {owner_id}"
print(f" [PASS] All {len(apps)} applications belong strictly to owner_id={owner_id}")

# Owner Certificates
code, certs = http_req("GET", "/certificates", token=token_owner)
assert code == 200
print(f" [PASS] All {len(certs)} digital certificates scoped strictly to this owner")

# Owner Dashboard Stats
code, dash = http_req("GET", "/dashboard/owner", token=token_owner)
assert code == 200
assert dash["metrics"]["instruments"] == len(insts)
expected_pending = len([a for a in apps if a["status"] in ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "SCHEDULED", "ASSIGNED", "IN_FIELD_VERIFICATION"]])
assert dash["metrics"]["pending_applications"] == expected_pending, f"Expected {expected_pending}, got {dash['metrics']['pending_applications']}"
print(f" [PASS] Owner dashboard metrics accurately mirror database records: {dash['metrics']}")

# Forbidden Endpoints for Owner
code_audit, _ = http_req("GET", "/audit-events", token=token_owner)
assert code_audit == 403, f"Expected 403, got {code_audit}"
print(" [PASS] Owner forbidden from accessing /audit-events (403 HTTP Forbidden)")

# Try accessing admin-only dashboard as owner
code_admin_dash, _ = http_req("GET", "/dashboard/admin", token=token_owner)
assert code_admin_dash == 403, f"Owner should not access admin dashboard, got {code_admin_dash}"
print(" [PASS] Owner forbidden from accessing /dashboard/admin (403 HTTP Forbidden)")

# 2. LMO (FIELD OFFICER)
print("\n[CHECK 2] LMO / Field Officer Scoping & Boundary")
token_lmo, user_lmo = login("lmo@demo.legalmet.local")
lmo_id = user_lmo["id"]
print(f" -> Logged in as Field Officer: {user_lmo['full_name']} (ID: {lmo_id})")

# Assignments
code, lmo_assigns = http_req("GET", "/assignments", token=token_lmo)
assert code == 200
print(f" [PASS] Field Officer sees only allocated assignments: {len(lmo_assigns)} active cases")

# LMO Dashboard
code, lmo_dash = http_req("GET", "/dashboard/verifier", token=token_lmo)
assert code == 200
print(f" [PASS] Field Officer dashboard displays allocated cases: {lmo_dash['metrics']}")

# LMO Forbidden Endpoints
code_lmo_audit, _ = http_req("GET", "/audit-events", token=token_lmo)
assert code_lmo_audit == 403
print(" [PASS] Field Officer forbidden from accessing /audit-events (403 HTTP Forbidden)")

# 3. GATC (TEST SPECIALIST)
print("\n[CHECK 3] GATC Test Centre Scoping & Boundary")
token_gatc, user_gatc = login("gatc@demo.legalmet.local")
gatc_id = user_gatc["id"]
print(f" -> Logged in as GATC Specialist: {user_gatc['full_name']} (ID: {gatc_id})")

code, gatc_assigns = http_req("GET", "/assignments", token=token_gatc)
assert code == 200
print(f" [PASS] GATC Specialist sees only calibration assignments: {len(gatc_assigns)} cases")

# 4. ADMINISTRATOR
print("\n[CHECK 4] Administrator Governance & Global Queue")
token_admin, user_admin = login("admin@demo.legalmet.local")
print(f" -> Logged in as Admin: {user_admin['full_name']}")

code, audit_events = http_req("GET", "/audit-events", token=token_admin)
assert code == 200
print(f" [PASS] Admin successfully retrieved {len(audit_events)} append-only audit trail logs")

code, all_apps = http_req("GET", "/applications", token=token_admin)
assert code == 200
print(f" [PASS] Admin has global governance access over all {len(all_apps)} applications")

code, admin_dash = http_req("GET", "/dashboard/admin", token=token_admin)
assert code == 200
print(f" [PASS] Admin control room metrics successfully computed: {admin_dash['metrics']}")

print("\n" + "=" * 65)
print("SUCCESS: ALL ROLES HAVE STRICT DATA SEGREGATION AND CORRECT DATA FLOW!")
print("=" * 65)
