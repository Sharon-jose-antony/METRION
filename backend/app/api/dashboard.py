from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import (
    Instrument, Application, ApplicationStatus, Schedule, Assignment,
    Certificate, CertificateStatus, VerificationEvent, InstrumentCategory,
    User, UserRole
)
from app.schemas.schemas import AdminDashboardResponse, OwnerDashboardResponse, VerifierDashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])

@router.get("/admin", response_model=AdminDashboardResponse)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    now = datetime.now(timezone.utc)
    thirty_days = now + timedelta(days=30)

    # Database counts
    total_instruments = db.query(Instrument).count()
    pending_applications = db.query(Application).filter(
        Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW])
    ).count()
    scheduled_verifications = db.query(Application).filter(
        Application.status == ApplicationStatus.SCHEDULED
    ).count()
    in_field_verifications = db.query(Application).filter(
        Application.status.in_([ApplicationStatus.ASSIGNED, ApplicationStatus.IN_FIELD_VERIFICATION])
    ).count()
    verified_instruments = db.query(Instrument).filter(
        Instrument.current_status == "VERIFIED"
    ).count()
    
    # Expiry tracking from actual valid_until_date
    expired_count = db.query(Certificate).filter(
        Certificate.status == CertificateStatus.EXPIRED
    ).count()
    # Check for certificates expiring within 30 days
    expiring_soon_count = db.query(Certificate).filter(
        Certificate.status == CertificateStatus.VALID,
        Certificate.valid_until_date <= thirty_days,
        Certificate.valid_until_date >= now
    ).count()

    metrics = {
        "total_instruments": total_instruments,
        "pending_applications": pending_applications,
        "scheduled_verifications": scheduled_verifications,
        "in_field_verifications": in_field_verifications,
        "verified_instruments": verified_instruments,
        "expiring_soon": expiring_soon_count,
        "expired": expired_count,
        "total_certificates": db.query(Certificate).count()
    }

    # Action Queue
    action_queue = []
    
    # 1. Pending Review Applications
    pending_apps = db.query(Application).filter(
        Application.status == ApplicationStatus.SUBMITTED
    ).order_by(Application.created_at.asc()).limit(5).all()
    for pa in pending_apps:
        inst = pa.instrument
        action_queue.append({
            "id": pa.id,
            "title": f"Review Application {pa.application_number}",
            "subtitle": f"{inst.manufacturer} {inst.model} ({inst.category.name if inst.category else 'Instrument'}) — {pa.owner.full_name if pa.owner else 'Owner'}",
            "severity": "HIGH",
            "action_label": "Review & Schedule",
            "action_link": f"/admin/applications/{pa.id}",
            "badge": "Awaiting Review"
        })

    # 2. Accepted but unassigned
    unassigned_apps = db.query(Application).filter(
        Application.status == ApplicationStatus.ACCEPTED
    ).limit(3).all()
    for ua in unassigned_apps:
        action_queue.append({
            "id": ua.id,
            "title": f"Allocate Verifier for {ua.application_number}",
            "subtitle": f"Location: {ua.instrument.district if ua.instrument else 'Delhi'}",
            "severity": "HIGH",
            "action_label": "Schedule & Assign",
            "action_link": f"/admin/applications/{ua.id}",
            "badge": "Needs Allocation"
        })

    # 3. Expiring Soon Certificates
    expiring_certs = db.query(Certificate).filter(
        Certificate.status == CertificateStatus.VALID,
        Certificate.valid_until_date <= thirty_days
    ).order_by(Certificate.valid_until_date.asc()).limit(4).all()
    for ec in expiring_certs:
        days_left = max(0, (ec.valid_until_date.replace(tzinfo=timezone.utc) - now).days) if ec.valid_until_date.tzinfo is None else max(0, (ec.valid_until_date - now).days)
        action_queue.append({
            "id": ec.id,
            "title": f"Certificate {ec.certificate_number} Due in {days_left} Days",
            "subtitle": f"Instrument {ec.instrument.instrument_id if ec.instrument else ''} ({ec.instrument.manufacturer if ec.instrument else ''})",
            "severity": "URGENT" if days_left < 10 else "MEDIUM",
            "action_label": "Issue Notice",
            "action_link": f"/admin/certificates",
            "badge": f"{days_left}d Left"
        })

    # Status distribution
    status_counts = db.query(Application.status, func.count(Application.id))\
                      .group_by(Application.status).all()
    status_distribution = {status.value: count for status, count in status_counts}

    # Category distribution
    cat_counts = db.query(InstrumentCategory.name, func.count(Instrument.id))\
                   .join(Instrument, InstrumentCategory.id == Instrument.category_id, isouter=True)\
                   .group_by(InstrumentCategory.name).all()
    category_distribution = {name: count for name, count in cat_counts if count > 0}

    # Recent verifications
    recent_verifs = db.query(VerificationEvent).order_by(VerificationEvent.verification_date.desc()).limit(6).all()
    recent_verif_list = []
    for rv in recent_verifs:
        recent_verif_list.append({
            "id": rv.id,
            "instrument_id": rv.instrument.instrument_id if rv.instrument else "N/A",
            "category": rv.instrument.category.name if (rv.instrument and rv.instrument.category) else "Standard",
            "verifier": rv.verifier.full_name if rv.verifier else "LMO",
            "result": rv.result.value,
            "date": rv.verification_date.strftime("%d-%b-%Y"),
            "certificate_number": rv.certificate.certificate_number if rv.certificate else None
        })

    # Workload distribution across LMOs
    lmos = db.query(User).filter(User.role.in_([UserRole.LMO, UserRole.GATC])).all()
    workload = []
    for lmo in lmos:
        case_count = db.query(Assignment).filter(
            Assignment.assigned_to_user_id == lmo.id,
            Assignment.status != "COMPLETED"
        ).count()
        completed_count = db.query(VerificationEvent).filter(
            VerificationEvent.verifier_id == lmo.id
        ).count()
        workload.append({
            "name": lmo.full_name,
            "role": lmo.role.value,
            "active_cases": case_count,
            "completed_cases": completed_count,
            "district": lmo.jurisdiction_district or "Delhi"
        })

    return {
        "metrics": metrics,
        "action_queue": action_queue,
        "status_distribution": status_distribution,
        "category_distribution": category_distribution,
        "recent_verifications": recent_verif_list,
        "workload_distribution": workload
    }

@router.get("/owner", response_model=OwnerDashboardResponse)
def get_owner_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    thirty_days = now + timedelta(days=30)

    my_instruments = db.query(Instrument).filter(Instrument.owner_id == current_user.id).all()
    inst_ids = [i.id for i in my_instruments]

    instruments_count = len(my_instruments)
    pending_applications_count = db.query(Application).filter(
        Application.owner_id == current_user.id,
        Application.status.in_([
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.ACCEPTED,
            ApplicationStatus.SCHEDULED,
            ApplicationStatus.ASSIGNED,
            ApplicationStatus.IN_FIELD_VERIFICATION
        ])
    ).count()

    valid_certificates_count = db.query(Certificate).filter(
        Certificate.issued_to_owner_id == current_user.id,
        Certificate.status == CertificateStatus.VALID
    ).count()

    expiring_soon_count = db.query(Certificate).filter(
        Certificate.issued_to_owner_id == current_user.id,
        Certificate.status == CertificateStatus.VALID,
        Certificate.valid_until_date <= thirty_days
    ).count()

    metrics = {
        "instruments": instruments_count,
        "pending_applications": pending_applications_count,
        "valid_certificates": valid_certificates_count,
        "expiring_soon": expiring_soon_count
    }

    recent_instruments_data = []
    for inst in my_instruments[:5]:
        active_cert = db.query(Certificate).filter(Certificate.id == inst.active_certificate_id).first() if inst.active_certificate_id else None
        recent_instruments_data.append({
            "id": inst.id,
            "instrument_id": inst.instrument_id,
            "category": inst.category.name if inst.category else "Standard",
            "name": f"{inst.manufacturer} {inst.model}",
            "serial_number": inst.serial_number,
            "status": inst.current_status,
            "valid_until": active_cert.valid_until_date.strftime("%d-%b-%Y") if (active_cert and active_cert.valid_until_date) else None,
            "certificate_id": active_cert.id if active_cert else None
        })

    active_apps = db.query(Application).filter(
        Application.owner_id == current_user.id
    ).order_by(Application.created_at.desc()).limit(5).all()

    active_apps_data = []
    for a in active_apps:
        active_apps_data.append({
            "id": a.id,
            "application_number": a.application_number,
            "type": a.application_type.value,
            "instrument_name": f"{a.instrument.manufacturer} {a.instrument.model}" if a.instrument else None,
            "status": a.status.value,
            "created_at": a.created_at.strftime("%d-%b-%Y")
        })

    expiring_certs = db.query(Certificate).filter(
        Certificate.issued_to_owner_id == current_user.id,
        Certificate.status == CertificateStatus.VALID,
        Certificate.valid_until_date <= thirty_days
    ).all()

    expiring_certs_data = []
    for ec in expiring_certs:
        expiring_certs_data.append({
            "id": ec.id,
            "certificate_number": ec.certificate_number,
            "instrument_id": ec.instrument.id if ec.instrument else None,
            "instrument_permanent_id": ec.instrument.instrument_id if ec.instrument else None,
            "instrument_name": f"{ec.instrument.manufacturer} {ec.instrument.model}" if ec.instrument else None,
            "valid_until": ec.valid_until_date.strftime("%d-%b-%Y") if ec.valid_until_date else None,
            "can_reverify": True
        })

    return {
        "metrics": metrics,
        "instruments_count": instruments_count,
        "pending_applications_count": pending_applications_count,
        "valid_certificates_count": valid_certificates_count,
        "expiring_soon_count": expiring_soon_count,
        "recent_instruments": recent_instruments_data,
        "active_applications": active_apps_data,
        "expiring_certificates": expiring_certs_data
    }

@router.get("/verifier", response_model=VerifierDashboardResponse)
def get_verifier_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Active assignments for this officer
    assignments = db.query(Assignment).filter(
        Assignment.assigned_to_user_id == current_user.id
    ).all()

    today_list = []
    upcoming_list = []

    for a in assignments:
        app = a.application
        inst = app.instrument if app else None
        sched = a.schedule
        
        if not app or app.status in [ApplicationStatus.CERTIFICATE_ISSUED, ApplicationStatus.REJECTED]:
            continue

        item = {
            "assignment_id": a.id,
            "application_id": app.id,
            "application_number": app.application_number,
            "instrument_id": inst.instrument_id if inst else None,
            "instrument_name": f"{inst.manufacturer} {inst.model}" if inst else None,
            "instrument_category": inst.category.name if (inst and inst.category) else None,
            "owner_name": inst.owner.full_name if (inst and inst.owner) else None,
            "owner_phone": inst.owner.phone if (inst and inst.owner) else None,
            "location": sched.location_address if sched else (inst.installation_address if inst else None),
            "scheduled_date": sched.scheduled_date.strftime("%d-%b-%Y") if sched else None,
            "time_window": sched.time_window if sched else "Standard Slot",
            "status": app.status.value
        }

        # Check if today or upcoming
        if sched and sched.scheduled_date:
            sched_date = sched.scheduled_date
            if sched_date.tzinfo is None:
                sched_date = sched_date.replace(tzinfo=timezone.utc)
            if today_start <= sched_date <= today_end:
                today_list.append(item)
            else:
                upcoming_list.append(item)
        else:
            today_list.append(item)

    # Completed verifications
    completed = db.query(VerificationEvent).filter(
        VerificationEvent.verifier_id == current_user.id
    ).order_by(VerificationEvent.verification_date.desc()).limit(10).all()

    completed_list = []
    for c in completed:
        completed_list.append({
            "id": c.id,
            "application_id": c.application_id,
            "instrument_id": c.instrument.instrument_id if c.instrument else None,
            "instrument_name": f"{c.instrument.manufacturer} {c.instrument.model}" if c.instrument else None,
            "result": c.result.value,
            "date": c.verification_date.strftime("%d-%b-%Y"),
            "certificate_number": c.certificate.certificate_number if c.certificate else None
        })

    metrics = {
        "today_cases": len(today_list),
        "upcoming_cases": len(upcoming_list),
        "completed_total": len(completed)
    }

    return {
        "metrics": metrics,
        "today_assignments": today_list,
        "upcoming_assignments": upcoming_list,
        "completed_recent": completed_list
    }
