from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import (
    Instrument, InstrumentCategory, Application, VerificationEvent,
    Certificate, User, UserRole
)
from app.schemas.schemas import (
    InstrumentCreate, InstrumentUpdate, InstrumentResponse, InstrumentCategoryResponse
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/instruments", tags=["Instruments"])

def generate_permanent_instrument_id(db: Session) -> str:
    count = db.query(Instrument).count() + 1
    return f"LM-INST-{count:06d}"

@router.get("/categories", response_model=List[InstrumentCategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(InstrumentCategory).filter(InstrumentCategory.is_active == True).all()

@router.get("", response_model=List[InstrumentResponse])
def list_instruments(
    category_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Instrument)

    # RBAC: Owners only see their own registered instruments
    if current_user.role == UserRole.INSTRUMENT_OWNER:
        query = query.filter(Instrument.owner_id == current_user.id)

    if category_id:
        query = query.filter(Instrument.category_id == category_id)

    if status_filter:
        query = query.filter(Instrument.current_status == status_filter)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Instrument.instrument_id.ilike(search_pattern),
                Instrument.serial_number.ilike(search_pattern),
                Instrument.manufacturer.ilike(search_pattern),
                Instrument.model.ilike(search_pattern),
                Instrument.installation_address.ilike(search_pattern)
            )
        )

    instruments = query.order_by(Instrument.created_at.desc()).all()
    
    # Map additional fields for response
    result = []
    for inst in instruments:
        active_cert = db.query(Certificate).filter(Certificate.id == inst.active_certificate_id).first() if inst.active_certificate_id else None
        inst_dict = {
            "id": inst.id,
            "instrument_id": inst.instrument_id,
            "category_id": inst.category_id,
            "category_name": inst.category.name if inst.category else None,
            "category_code": inst.category.code if inst.category else None,
            "owner_id": inst.owner_id,
            "owner_name": inst.owner.full_name if inst.owner else None,
            "owner_email": inst.owner.email if inst.owner else None,
            "organization_id": inst.organization_id,
            "organization_name": inst.organization.name if inst.organization else None,
            "manufacturer": inst.manufacturer,
            "model": inst.model,
            "serial_number": inst.serial_number,
            "capacity": inst.capacity,
            "accuracy_class": inst.accuracy_class,
            "year_of_manufacture": inst.year_of_manufacture,
            "installation_address": inst.installation_address,
            "state": inst.state,
            "district": inst.district,
            "pincode": inst.pincode,
            "current_status": inst.current_status,
            "active_certificate_id": inst.active_certificate_id,
            "active_certificate_number": active_cert.certificate_number if active_cert else None,
            "valid_until_date": active_cert.valid_until_date if active_cert else None,
            "is_demo": inst.is_demo,
            "created_at": inst.created_at,
            "updated_at": inst.updated_at
        }
        result.append(inst_dict)
    return result

@router.post("", response_model=InstrumentResponse)
def register_instrument(
    inst_in: InstrumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify category
    cat = db.query(InstrumentCategory).filter(InstrumentCategory.id == inst_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instrument category not found")

    # Check for duplicate serial number within same manufacturer
    duplicate = db.query(Instrument).filter(
        Instrument.manufacturer.ilike(inst_in.manufacturer.strip()),
        Instrument.serial_number.ilike(inst_in.serial_number.strip())
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Serial number '{inst_in.serial_number}' is already registered for manufacturer '{inst_in.manufacturer}' (ID: {duplicate.instrument_id})."
        )

    perm_id = generate_permanent_instrument_id(db)

    new_inst = Instrument(
        instrument_id=perm_id,
        category_id=inst_in.category_id,
        owner_id=current_user.id,
        organization_id=current_user.organization_id,
        manufacturer=inst_in.manufacturer.strip(),
        model=inst_in.model.strip(),
        serial_number=inst_in.serial_number.strip(),
        capacity=inst_in.capacity,
        accuracy_class=inst_in.accuracy_class,
        year_of_manufacture=inst_in.year_of_manufacture,
        installation_address=inst_in.installation_address.strip(),
        state=inst_in.state or "Delhi",
        district=inst_in.district or "Central Delhi",
        pincode=inst_in.pincode,
        current_status="REGISTERED",
        is_demo=True
    )
    db.add(new_inst)
    db.commit()
    db.refresh(new_inst)

    log_audit_event(
        db=db,
        action="INSTRUMENT_REGISTERED",
        description=f"Instrument {new_inst.instrument_id} ({new_inst.manufacturer} {new_inst.model}, S/N: {new_inst.serial_number}) registered by {current_user.email}",
        user=current_user,
        entity_type="INSTRUMENT",
        entity_id=str(new_inst.id)
    )

    return {
        "id": new_inst.id,
        "instrument_id": new_inst.instrument_id,
        "category_id": new_inst.category_id,
        "category_name": cat.name,
        "category_code": cat.code,
        "owner_id": new_inst.owner_id,
        "owner_name": current_user.full_name,
        "owner_email": current_user.email,
        "organization_id": new_inst.organization_id,
        "organization_name": current_user.organization.name if current_user.organization else None,
        "manufacturer": new_inst.manufacturer,
        "model": new_inst.model,
        "serial_number": new_inst.serial_number,
        "capacity": new_inst.capacity,
        "accuracy_class": new_inst.accuracy_class,
        "year_of_manufacture": new_inst.year_of_manufacture,
        "installation_address": new_inst.installation_address,
        "state": new_inst.state,
        "district": new_inst.district,
        "pincode": new_inst.pincode,
        "current_status": new_inst.current_status,
        "active_certificate_id": None,
        "active_certificate_number": None,
        "valid_until_date": None,
        "is_demo": new_inst.is_demo,
        "created_at": new_inst.created_at,
        "updated_at": new_inst.updated_at
    }

@router.get("/{id}", response_model=InstrumentResponse)
def get_instrument(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inst = db.query(Instrument).filter(Instrument.id == id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instrument not found")

    if current_user.role == UserRole.INSTRUMENT_OWNER and inst.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this instrument")

    active_cert = db.query(Certificate).filter(Certificate.id == inst.active_certificate_id).first() if inst.active_certificate_id else None

    return {
        "id": inst.id,
        "instrument_id": inst.instrument_id,
        "category_id": inst.category_id,
        "category_name": inst.category.name if inst.category else None,
        "category_code": inst.category.code if inst.category else None,
        "owner_id": inst.owner_id,
        "owner_name": inst.owner.full_name if inst.owner else None,
        "owner_email": inst.owner.email if inst.owner else None,
        "organization_id": inst.organization_id,
        "organization_name": inst.organization.name if inst.organization else None,
        "manufacturer": inst.manufacturer,
        "model": inst.model,
        "serial_number": inst.serial_number,
        "capacity": inst.capacity,
        "accuracy_class": inst.accuracy_class,
        "year_of_manufacture": inst.year_of_manufacture,
        "installation_address": inst.installation_address,
        "state": inst.state,
        "district": inst.district,
        "pincode": inst.pincode,
        "current_status": inst.current_status,
        "active_certificate_id": inst.active_certificate_id,
        "active_certificate_number": active_cert.certificate_number if active_cert else None,
        "valid_until_date": active_cert.valid_until_date if active_cert else None,
        "is_demo": inst.is_demo,
        "created_at": inst.created_at,
        "updated_at": inst.updated_at
    }

@router.get("/{id}/history")
def get_instrument_lifecycle_history(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inst = db.query(Instrument).filter(Instrument.id == id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instrument not found")

    if current_user.role == UserRole.INSTRUMENT_OWNER and inst.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    timeline = []

    # 1. Registration Event
    timeline.append({
        "event_type": "REGISTRATION",
        "title": "Instrument Registered in Registry",
        "timestamp": inst.created_at,
        "actor": inst.owner.full_name if inst.owner else "Owner",
        "details": f"Assigned permanent identity {inst.instrument_id} for {inst.manufacturer} {inst.model} (S/N: {inst.serial_number})"
    })

    # 2. Applications & Status Transitions
    applications = db.query(Application).filter(Application.instrument_id == inst.id).order_by(Application.created_at.asc()).all()
    for app in applications:
        timeline.append({
            "event_type": "APPLICATION_CREATED",
            "title": f"Application Created ({app.application_type.value.replace('_', ' ').title()})",
            "timestamp": app.created_at,
            "actor": app.owner.full_name if app.owner else "Owner",
            "details": f"Application ID: {app.application_number}. Status: {app.status.value}"
        })
        for sh in app.status_history:
            timeline.append({
                "event_type": "STATUS_CHANGE",
                "title": f"Status: {sh.to_status.replace('_', ' ').title()}",
                "timestamp": sh.created_at,
                "actor": f"{sh.actor.full_name if sh.actor else 'System'} ({sh.actor_role or 'SYSTEM'})",
                "details": sh.remarks or f"Transitioned from {sh.from_status or 'N/A'}"
            })

    # 3. Verification Events
    verifications = db.query(VerificationEvent).filter(VerificationEvent.instrument_id == inst.id).order_by(VerificationEvent.verification_date.asc()).all()
    for v in verifications:
        timeline.append({
            "event_type": "FIELD_VERIFICATION",
            "title": f"Field Verification Completed — Result: {v.result.value}",
            "timestamp": v.verification_date,
            "actor": f"{v.verifier.full_name if v.verifier else 'Verifier'} ({v.verifier_role})",
            "details": f"Checklist validated. Remarks: {v.verifier_remarks or 'None'}"
        })

    # 4. Certificates Issued
    certificates = db.query(Certificate).filter(Certificate.instrument_id == inst.id).order_by(Certificate.issue_date.asc()).all()
    for c in certificates:
        timeline.append({
            "event_type": "CERTIFICATE_ISSUED",
            "title": f"Digital Certificate Issued: {c.certificate_number}",
            "timestamp": c.issue_date,
            "actor": c.issued_by.full_name if c.issued_by else "Authority",
            "details": f"Status: {c.status.value}. Valid until: {c.valid_until_date.strftime('%d-%b-%Y')}. QR code authenticated."
        })
        if c.status.value == "REVOKED" and c.revoked_at:
            timeline.append({
                "event_type": "CERTIFICATE_REVOKED",
                "title": f"Certificate Revoked: {c.certificate_number}",
                "timestamp": c.revoked_at,
                "actor": c.revoked_by.full_name if c.revoked_by else "Admin",
                "details": f"Reason: {c.revocation_reason or 'None'}"
            })

    # Sort chronological
    timeline.sort(key=lambda x: x["timestamp"])

    return {
        "instrument_id": inst.instrument_id,
        "model": f"{inst.manufacturer} {inst.model}",
        "serial_number": inst.serial_number,
        "current_status": inst.current_status,
        "timeline": timeline
    }
