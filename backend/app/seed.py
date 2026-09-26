import os
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.models import (
    User, UserRole, Organization, OrgType,
    InstrumentCategory, Instrument,
    Application, ApplicationType, ApplicationStatus, ApplicationStatusHistory,
    Schedule, Assignment,
    Rule, RuleVersion, Checklist, ChecklistItem,
    VerificationEvent, VerificationResult, Observation,
    Certificate, CertificateStatus, CertificateEvent,
    Notification, AuditEvent
)
from app.services.certificate_service import generate_certificate_pdf
from app.services.notification_service import send_notification


DEMO_PASSWORD = "DemoPass@123"

def seed_database():
    print("[*] Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@demo.legalmet.local").first():
            print("[+] Database already seeded. Skipping initial seed.")
            return

        print("[*] Seeding demo organizations...")
        org_dept = Organization(
            name="Delhi Legal Metrology Headquarters (DEMO)",
            org_type=OrgType.ADMIN_DEPT,
            registration_number="GOV-DL-LM-HQ-2026",
            address="Vikas Bhawan, IP Estate, New Delhi",
            state="Delhi",
            district="Central Delhi",
            contact_email="admin@demo.legalmet.local",
            is_demo=True
        )
        org_lmo = Organization(
            name="Zonal Legal Metrology Office - Central Delhi (DEMO)",
            org_type=OrgType.LMO_OFFICE,
            registration_number="GOV-DL-LM-Z01",
            address="Connaught Place Zonal Inspection Bureau, New Delhi",
            state="Delhi",
            district="Central Delhi",
            contact_email="lmo@demo.legalmet.local",
            is_demo=True
        )
        org_gatc = Organization(
            name="National Metrology Calibration & Test Centre (DEMO GATC)",
            org_type=OrgType.GATC,
            registration_number="GATC-IND-2026-089",
            address="Okhla Industrial Area Phase-II, New Delhi",
            state="Delhi",
            district="South Delhi",
            contact_email="gatc@demo.legalmet.local",
            is_demo=True
        )
        org_owner = Organization(
            name="Apex Retail & Logistics Enterprises Pvt Ltd (DEMO)",
            org_type=OrgType.BUSINESS,
            registration_number="CIN-U51909DL2022PTC123456",
            address="Warehouse 4B, Mayapuri Industrial Area, New Delhi",
            state="Delhi",
            district="West Delhi",
            contact_email="owner@demo.legalmet.local",
            is_demo=True
        )
        db.add_all([org_dept, org_lmo, org_gatc, org_owner])
        db.commit()

        print("[*] Seeding demo users with roles...")
        pw_hash = get_password_hash(DEMO_PASSWORD)
        
        user_admin = User(
            email="admin@demo.legalmet.local",
            hashed_password=pw_hash,
            full_name="Rajesh Sharma (Admin)",
            phone="+91 98100 11223",
            role=UserRole.ADMIN,
            organization_id=org_dept.id,
            designation="Director of Legal Metrology (Enforcement)",
            jurisdiction_state="Delhi",
            jurisdiction_district="All Districts",
            is_active=True,
            is_demo=True
        )
        user_owner = User(
            email="owner@demo.legalmet.local",
            hashed_password=pw_hash,
            full_name="Sanjay Gupta (Instrument Owner)",
            phone="+91 98200 33445",
            role=UserRole.INSTRUMENT_OWNER,
            organization_id=org_owner.id,
            designation="Authorized Signatory & Operations Head",
            jurisdiction_state="Delhi",
            jurisdiction_district="West Delhi",
            is_active=True,
            is_demo=True
        )
        user_lmo = User(
            email="lmo@demo.legalmet.local",
            hashed_password=pw_hash,
            full_name="Inspector Vikram Malhotra (LMO)",
            phone="+91 98300 55667",
            role=UserRole.LMO,
            organization_id=org_lmo.id,
            designation="Senior Legal Metrology Officer",
            jurisdiction_state="Delhi",
            jurisdiction_district="Central Delhi",
            is_active=True,
            is_demo=True
        )
        user_gatc = User(
            email="gatc@demo.legalmet.local",
            hashed_password=pw_hash,
            full_name="Dr. Ananya Sen (GATC Specialist)",
            phone="+91 98400 77889",
            role=UserRole.GATC,
            organization_id=org_gatc.id,
            designation="Lead Metrologist — Calibration Division",
            jurisdiction_state="Delhi",
            jurisdiction_district="South Delhi",
            is_active=True,
            is_demo=True
        )
        db.add_all([user_admin, user_owner, user_lmo, user_gatc])
        db.commit()

        print("[*] Seeding instrument categories...")
        cat_nawi = InstrumentCategory(
            code="NAWI",
            name="Non-Automatic Weighing Instruments (NAWI)",
            description="Electronic counter scales, bench scales, and platform scales used for commercial trade and custody transfer.",
            default_validity_months=12,
            is_active=True
        )
        cat_weighbridge = InstrumentCategory(
            code="WEIGHBRIDGE",
            name="Electronic Road Vehicle Weighbridges",
            description="Heavy capacity pitless/pit type road weighbridges used in transport, cargo depots, and mandi terminals.",
            default_validity_months=12,
            is_active=True
        )
        cat_dispenser = InstrumentCategory(
            code="FUEL_DISPENSER",
            name="Retail Motor Fuel Dispensers",
            description="Multi-product petroleum dispensers installed at authorized retail outlets.",
            default_validity_months=12,
            is_active=True
        )
        cat_balance = InstrumentCategory(
            code="PRECISION_BALANCE",
            name="High Precision Laboratory & Bullion Balances",
            description="Class I & Class II analytical precision balances used in bullion, gems, and pharmaceutical formulation.",
            default_validity_months=12,
            is_active=True
        )
        db.add_all([cat_nawi, cat_weighbridge, cat_dispenser, cat_balance])
        db.commit()

        print("[*] Seeding versioned rule engine and checklists...")
        rule_demo = Rule(
            name="General Legal Metrology Verification Rules",
            reference_code="LM-RULES-2011-DEMO",
            jurisdiction="National Jurisdiction",
            is_active=True
        )
        db.add(rule_demo)
        db.commit()

        rule_ver = RuleVersion(
            rule_id=rule_demo.id,
            version_number="v2026.1-DEMO",
            effective_from=datetime.now(timezone.utc) - timedelta(days=365),
            is_current=True,
            statutory_disclaimer="DEMO CONFIGURATION — NOT A STATUTORY DETERMINATION. Prototype checklist for SIH26036 demonstration only."
        )
        db.add(rule_ver)
        db.commit()

        # Checklist for NAWI
        chk_nawi = Checklist(
            rule_version_id=rule_ver.id,
            category_id=cat_nawi.id,
            name="NAWI Statutory Verification Protocol",
            description="Standard procedural verification checklist for commercial electronic platform and counter scales."
        )
        db.add(chk_nawi)
        db.commit()

        chk_items_nawi = [
            ChecklistItem(
                checklist_id=chk_nawi.id, order_index=1, code="CHK_PHYS_INSPECT",
                label="Physical Examination & Maker's Data Plate Legibility",
                field_type="BOOLEAN", required=True, help_text="Verify maker plate, model approval number, and stamping area."
            ),
            ChecklistItem(
                checklist_id=chk_nawi.id, order_index=2, code="CHK_SEAL_INTEGRITY",
                label="Lead & Wire Security Seal Integrity",
                field_type="BOOLEAN", required=True, help_text="Ensure adjustment mechanism is fully sealed and tamper-evident."
            ),
            ChecklistItem(
                checklist_id=chk_nawi.id, order_index=3, code="CHK_ZERO_SETTING",
                label="Zero-Setting & Tare Device Functionality",
                field_type="BOOLEAN", required=True, help_text="Check zero indication within ±0.25e."
            ),
            ChecklistItem(
                checklist_id=chk_nawi.id, order_index=4, code="CHK_ECCENTRICITY",
                label="Eccentricity Load Test (1/3 Max on 4 Quadrants)",
                field_type="BOOLEAN", required=True, help_text="Place test weight off-center in each quadrant."
            ),
            ChecklistItem(
                checklist_id=chk_nawi.id, order_index=5, code="CHK_MAX_ERROR",
                label="Observed Error at Maximum Capacity (e / grams)",
                field_type="NUMBER", unit="g", min_value=-5.0, max_value=5.0, required=True,
                help_text="Permissible tolerance limit is ±5.0g for this test load."
            ),
            ChecklistItem(
                checklist_id=chk_nawi.id, order_index=6, code="CHK_DISP_STABILITY",
                label="Digital Display Stability & Environmental Protection",
                field_type="BOOLEAN", required=True, help_text="Ensure stable weight readout without fluctuating digits."
            )
        ]
        db.add_all(chk_items_nawi)

        # Checklist for Weighbridge
        chk_wb = Checklist(
            rule_version_id=rule_ver.id,
            category_id=cat_weighbridge.id,
            name="Road Vehicle Weighbridge Verification Protocol",
            description="Verification checklist for multi-load cell weighbridges."
        )
        db.add(chk_wb)
        db.commit()

        chk_items_wb = [
            ChecklistItem(checklist_id=chk_wb.id, order_index=1, code="CHK_WB_CLEARANCE", label="Pit / Platform Clearance & Gap Inspection", field_type="BOOLEAN", required=True),
            ChecklistItem(checklist_id=chk_wb.id, order_index=2, code="CHK_WB_SUMMING", label="Junction Box Sealing & Lead Stamping", field_type="BOOLEAN", required=True),
            ChecklistItem(checklist_id=chk_wb.id, order_index=3, code="CHK_WB_SPAN_ERROR", label="Observed Error at Standard 10 Ton Load (kg)", field_type="NUMBER", unit="kg", min_value=-20.0, max_value=20.0, required=True)
        ]
        db.add_all(chk_items_wb)

        # Checklist for Fuel Dispenser
        chk_fuel = Checklist(
            rule_version_id=rule_ver.id,
            category_id=cat_dispenser.id,
            name="Retail Fuel Dispenser Verification Protocol",
            description="Checklist for petrol/diesel electronic dispensing units."
        )
        db.add(chk_fuel)
        db.commit()

        chk_items_fuel = [
            ChecklistItem(checklist_id=chk_fuel.id, order_index=1, code="CHK_FUEL_TOTALIZER", label="Totalizer Synchronization Check", field_type="BOOLEAN", required=True),
            ChecklistItem(checklist_id=chk_fuel.id, order_index=2, code="CHK_FUEL_ACCURACY", label="Error on 20L Standard Measure (% Error)", field_type="NUMBER", unit="%", min_value=-0.5, max_value=0.5, required=True),
            ChecklistItem(checklist_id=chk_fuel.id, order_index=3, code="CHK_FUEL_SEAL", label="Mechanical Meter Adjustment Wire Seal", field_type="BOOLEAN", required=True)
        ]
        db.add_all(chk_items_fuel)
        db.commit()

        print("[*] Seeding realistic demo instruments and lifecycle states...")
        now = datetime.now(timezone.utc)

        # -------------------------------------------------------------
        # 1. VERIFIED INSTRUMENT WITH ACTIVE DIGITAL CERTIFICATE
        # -------------------------------------------------------------
        inst_1 = Instrument(
            instrument_id="LM-INST-000001",
            category_id=cat_nawi.id,
            owner_id=user_owner.id,
            organization_id=org_owner.id,
            manufacturer="Avery Weigh-Tronix",
            model="E1010 Industrial Bench Scale",
            serial_number="AV-2025-99881",
            capacity="150 kg",
            accuracy_class="Class III (Medium)",
            year_of_manufacture=2024,
            installation_address="Bay 3, Dispatch Floor, Mayapuri Industrial Area",
            state="Delhi",
            district="West Delhi",
            pincode="110064",
            current_status="VERIFIED",
            is_demo=True,
            created_at=now - timedelta(days=90)
        )
        db.add(inst_1)
        db.commit()

        app_1 = Application(
            application_number="LM-APP-2026-000001",
            instrument_id=inst_1.id,
            owner_id=user_owner.id,
            application_type=ApplicationType.NEW_VERIFICATION,
            status=ApplicationStatus.CERTIFICATE_ISSUED,
            proposed_date=now - timedelta(days=80),
            remarks="Annual statutory verification required for custody transfer.",
            review_notes="All documents verified compliant.",
            reviewed_by_id=user_admin.id,
            is_demo=True,
            created_at=now - timedelta(days=85)
        )
        db.add(app_1)
        db.commit()

        sched_1 = Schedule(
            application_id=app_1.id,
            scheduled_date=now - timedelta(days=75),
            time_window="10:00 AM - 01:00 PM",
            location_address=inst_1.installation_address,
            notes="Standard field verification slot.",
            created_by_id=user_admin.id,
            created_at=now - timedelta(days=78)
        )
        db.add(sched_1)
        db.commit()

        assign_1 = Assignment(
            schedule_id=sched_1.id,
            application_id=app_1.id,
            assigned_to_type="LMO",
            assigned_to_user_id=user_lmo.id,
            assigned_by_id=user_admin.id,
            status="COMPLETED",
            created_at=now - timedelta(days=78)
        )
        db.add(assign_1)
        db.commit()

        verif_1 = VerificationEvent(
            application_id=app_1.id,
            instrument_id=inst_1.id,
            verifier_id=user_lmo.id,
            verifier_role="LMO",
            rule_version_id=rule_ver.id,
            verification_date=now - timedelta(days=75),
            result=VerificationResult.VERIFIED,
            verifier_remarks="Physical inspection, load test and repeatability confirmed within statutory tolerance. All seals affixed.",
            geo_latitude=28.6280,
            geo_longitude=77.1050,
            is_demo=True,
            created_at=now - timedelta(days=75)
        )
        db.add(verif_1)
        db.commit()

        # Observations for verif_1
        for itm in chk_items_nawi:
            val = "Pass" if itm.field_type == "BOOLEAN" else "1.2"
            db.add(Observation(
                verification_event_id=verif_1.id,
                checklist_item_id=itm.id,
                item_label=itm.label,
                item_type=itm.field_type,
                value_entered=val,
                unit=itm.unit,
                is_compliant=True,
                remarks="Compliant with tolerance"
            ))

        cert_1 = Certificate(
            certificate_number="LM-CERT-2026-000001",
            qr_token="a1b2c3d4e5f67890abcdef1234567890",
            instrument_id=inst_1.id,
            application_id=app_1.id,
            verification_event_id=verif_1.id,
            issued_to_owner_id=user_owner.id,
            issued_by_user_id=user_lmo.id,
            issuing_authority_name="Department of Legal Metrology, Govt of NCT of Delhi",
            issue_date=now - timedelta(days=75),
            valid_until_date=now + timedelta(days=290),
            status=CertificateStatus.VALID,
            is_demo=True,
            created_at=now - timedelta(days=75)
        )
        db.add(cert_1)
        db.commit()
        db.refresh(cert_1)

        # Generate actual PDF file
        cert_1.pdf_path = generate_certificate_pdf(cert_1, inst_1, user_lmo, user_owner)
        inst_1.active_certificate_id = cert_1.id
        db.commit()

        # -------------------------------------------------------------
        # 2. INSTRUMENT EXPIRING SOON (IN 12 DAYS) — TRIGGER RE-VERIFICATION
        # -------------------------------------------------------------
        inst_2 = Instrument(
            instrument_id="LM-INST-000002",
            category_id=cat_nawi.id,
            owner_id=user_owner.id,
            organization_id=org_owner.id,
            manufacturer="Essae-Teraoka",
            model="DS-215 Electronic Counter Scale",
            serial_number="ES-2024-44102",
            capacity="30 kg",
            accuracy_class="Class III (Medium)",
            year_of_manufacture=2023,
            installation_address="Retail Counter 1, Central Logistics Hub, Connaught Place",
            state="Delhi",
            district="Central Delhi",
            pincode="110001",
            current_status="VERIFIED",
            is_demo=True,
            created_at=now - timedelta(days=350)
        )
        db.add(inst_2)
        db.commit()

        app_2 = Application(
            application_number="LM-APP-2025-000842",
            instrument_id=inst_2.id,
            owner_id=user_owner.id,
            application_type=ApplicationType.NEW_VERIFICATION,
            status=ApplicationStatus.CERTIFICATE_ISSUED,
            is_demo=True,
            created_at=now - timedelta(days=350)
        )
        db.add(app_2)
        db.commit()

        verif_2 = VerificationEvent(
            application_id=app_2.id,
            instrument_id=inst_2.id,
            verifier_id=user_lmo.id,
            verifier_role="LMO",
            rule_version_id=rule_ver.id,
            verification_date=now - timedelta(days=348),
            result=VerificationResult.VERIFIED,
            verifier_remarks="Passed previous annual verification.",
            is_demo=True
        )
        db.add(verif_2)
        db.commit()

        cert_2 = Certificate(
            certificate_number="LM-CERT-2025-000842",
            qr_token="b2c3d4e5f6a17890abcdef1234567891",
            instrument_id=inst_2.id,
            application_id=app_2.id,
            verification_event_id=verif_2.id,
            issued_to_owner_id=user_owner.id,
            issued_by_user_id=user_lmo.id,
            issuing_authority_name="Department of Legal Metrology, Govt of NCT of Delhi",
            issue_date=now - timedelta(days=348),
            valid_until_date=now + timedelta(days=12),  # EXPIRING IN 12 DAYS
            status=CertificateStatus.VALID,
            is_demo=True
        )
        db.add(cert_2)
        db.commit()
        db.refresh(cert_2)
        cert_2.pdf_path = generate_certificate_pdf(cert_2, inst_2, user_lmo, user_owner)
        inst_2.active_certificate_id = cert_2.id
        db.commit()

        # -------------------------------------------------------------
        # 3. EXPIRED CERTIFICATE (EXPIRED 20 DAYS AGO)
        # -------------------------------------------------------------
        inst_3 = Instrument(
            instrument_id="LM-INST-000003",
            category_id=cat_weighbridge.id,
            owner_id=user_owner.id,
            organization_id=org_owner.id,
            manufacturer="Mettler Toledo",
            model="IND570 Weighbridge Terminal (50T)",
            serial_number="MT-WB-2022-7719",
            capacity="50 Ton",
            accuracy_class="Class III (Medium)",
            year_of_manufacture=2022,
            installation_address="Gate 2 Inbound Weighbridge, Okhla Freight Terminal",
            state="Delhi",
            district="South Delhi",
            pincode="110020",
            current_status="EXPIRED",
            is_demo=True,
            created_at=now - timedelta(days=400)
        )
        db.add(inst_3)
        db.commit()

        app_3 = Application(
            application_number="LM-APP-2025-000109",
            instrument_id=inst_3.id,
            owner_id=user_owner.id,
            application_type=ApplicationType.NEW_VERIFICATION,
            status=ApplicationStatus.EXPIRED,
            is_demo=True,
            created_at=now - timedelta(days=385)
        )
        db.add(app_3)
        db.commit()

        verif_3 = VerificationEvent(
            application_id=app_3.id,
            instrument_id=inst_3.id,
            verifier_id=user_lmo.id,
            verifier_role="LMO",
            rule_version_id=rule_ver.id,
            verification_date=now - timedelta(days=385),
            result=VerificationResult.VERIFIED,
            is_demo=True
        )
        db.add(verif_3)
        db.commit()

        cert_3 = Certificate(
            certificate_number="LM-CERT-2025-000109",
            qr_token="c3d4e5f6a1b27890abcdef1234567892",
            instrument_id=inst_3.id,
            application_id=app_3.id,
            verification_event_id=verif_3.id,
            issued_to_owner_id=user_owner.id,
            issued_by_user_id=user_lmo.id,
            issuing_authority_name="Department of Legal Metrology, Govt of NCT of Delhi",
            issue_date=now - timedelta(days=385),
            valid_until_date=now - timedelta(days=20),  # EXPIRED 20 DAYS AGO
            status=CertificateStatus.EXPIRED,
            is_demo=True
        )
        db.add(cert_3)
        db.commit()
        db.refresh(cert_3)
        cert_3.pdf_path = generate_certificate_pdf(cert_3, inst_3, user_lmo, user_owner)
        inst_3.active_certificate_id = cert_3.id
        db.commit()

        # -------------------------------------------------------------
        # 4. FIELD VERIFICATION CASE CURRENTLY ASSIGNED TO LMO (READY FOR FIELD DEMO)
        # -------------------------------------------------------------
        inst_4 = Instrument(
            instrument_id="LM-INST-000004",
            category_id=cat_nawi.id,
            owner_id=user_owner.id,
            organization_id=org_owner.id,
            manufacturer="Sartorius",
            model="Combics 2 Industrial Scale",
            serial_number="SAR-2025-5590",
            capacity="60 kg",
            accuracy_class="Class III (Medium)",
            year_of_manufacture=2024,
            installation_address="Packaging Unit 1, Kirti Nagar Industrial Area",
            state="Delhi",
            district="West Delhi",
            pincode="110015",
            current_status="IN_FIELD_VERIFICATION",
            is_demo=True,
            created_at=now - timedelta(days=5)
        )
        db.add(inst_4)
        db.commit()

        app_4 = Application(
            application_number="LM-APP-2026-000004",
            instrument_id=inst_4.id,
            owner_id=user_owner.id,
            application_type=ApplicationType.NEW_VERIFICATION,
            status=ApplicationStatus.ASSIGNED,
            proposed_date=now,
            remarks="New installation verification request.",
            review_notes="Application approved by Directorate. Assigned for today's field inspection.",
            reviewed_by_id=user_admin.id,
            is_demo=True,
            created_at=now - timedelta(days=3)
        )
        db.add(app_4)
        db.commit()

        sched_4 = Schedule(
            application_id=app_4.id,
            scheduled_date=now,  # TODAY'S VERIFICATION!
            time_window="02:00 PM - 04:30 PM",
            location_address=inst_4.installation_address,
            notes="Please inspect security stamping wire and eccentricity readings.",
            created_by_id=user_admin.id,
            created_at=now - timedelta(days=2)
        )
        db.add(sched_4)
        db.commit()

        assign_4 = Assignment(
            schedule_id=sched_4.id,
            application_id=app_4.id,
            assigned_to_type="LMO",
            assigned_to_user_id=user_lmo.id,
            assigned_by_id=user_admin.id,
            status="ASSIGNED",
            created_at=now - timedelta(days=2)
        )
        db.add(assign_4)
        db.commit()

        # -------------------------------------------------------------
        # 5. NEW APPLICATION AWAITING ADMIN REVIEW & SCHEDULING
        # -------------------------------------------------------------
        inst_5 = Instrument(
            instrument_id="LM-INST-000005",
            category_id=cat_dispenser.id,
            owner_id=user_owner.id,
            organization_id=org_owner.id,
            manufacturer="Gilbarco Veeder-Root",
            model="Frontier Dual Nozzle Dispenser",
            serial_number="GVR-2025-1088",
            capacity="50 L/min",
            accuracy_class="Class 0.5",
            year_of_manufacture=2024,
            installation_address="Retail Fuel Station, Ring Road, Lajpat Nagar",
            state="Delhi",
            district="South Delhi",
            pincode="110024",
            current_status="APPLICATION_PENDING",
            is_demo=True,
            created_at=now - timedelta(days=2)
        )
        db.add(inst_5)
        db.commit()

        app_5 = Application(
            application_number="LM-APP-2026-000005",
            instrument_id=inst_5.id,
            owner_id=user_owner.id,
            application_type=ApplicationType.NEW_VERIFICATION,
            status=ApplicationStatus.SUBMITTED,
            proposed_date=now + timedelta(days=2),
            remarks="New dispenser commissioned at commercial retail fuel station.",
            is_demo=True,
            created_at=now - timedelta(days=1)
        )
        db.add(app_5)
        db.commit()

        db.add(ApplicationStatusHistory(
            application_id=app_5.id,
            from_status=None,
            to_status="SUBMITTED",
            actor_id=user_owner.id,
            actor_role="INSTRUMENT_OWNER",
            remarks="Application submitted by owner."
        ))
        db.commit()

        # Seed initial notification for owner and admin
        send_notification(
            db=db,
            user_id=user_owner.id,
            title="Expiry Alert: Instrument LM-INST-000002",
            message="Certificate LM-CERT-2025-000842 is due for statutory re-verification in 12 days.",
            notification_type="ALERT",
            link="/owner/certificates"
        )
        send_notification(
            db=db,
            user_id=user_lmo.id,
            title="Today's Field Verification Assigned",
            message="Case LM-APP-2026-000004 for Sartorius Combics 2 scale is scheduled today.",
            notification_type="INFO",
            link=f"/lmo/verification/{app_4.id}"
        )

        print("[+] Demo seed completed successfully with authentic realistic test cases!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
