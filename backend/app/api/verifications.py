import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_verifier
from app.models.models import (
    Application, ApplicationStatus, Instrument, VerificationEvent,
    VerificationResult, Observation, Attachment, Certificate, Checklist,
    ChecklistItem, RuleVersion, User, UserRole
)
from app.schemas.schemas import (
    VerificationSubmitRequest, VerificationResponse, ChecklistResponse,
    AttachmentResponse
)
from app.services.rule_engine import get_active_checklist_for_category, validate_observations
from app.services.workflow_engine import transition_application_status
from app.services.certificate_service import issue_certificate_for_event
from app.services.audit_service import log_audit_event
from app.services.notification_service import send_notification

router = APIRouter(prefix="/verifications", tags=["Field Verification"])

@router.get("/checklist-for-app/{application_id}")
def get_checklist_for_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    inst = app.instrument
    rule_version, checklist = get_active_checklist_for_category(db, inst.category_id)

    # If verifier opens the case and status is ASSIGNED or SCHEDULED, transition to IN_FIELD_VERIFICATION
    if current_user.role in [UserRole.LMO, UserRole.GATC]:
        if app.status in [ApplicationStatus.ASSIGNED, ApplicationStatus.SCHEDULED]:
            transition_application_status(
                db=db,
                application=app,
                target_status=ApplicationStatus.IN_FIELD_VERIFICATION,
                actor=current_user,
                remarks=f"Field verification started by {current_user.full_name} ({current_user.role.value})"
            )

    # Format response
    return {
        "rule_version_id": rule_version.id,
        "rule_version_code": rule_version.version_number,
        "statutory_disclaimer": rule_version.statutory_disclaimer,
        "checklist_id": checklist.id,
        "checklist_name": checklist.name,
        "description": checklist.description,
        "items": [
            {
                "id": item.id,
                "order_index": item.order_index,
                "code": item.code,
                "label": item.label,
                "field_type": item.field_type,
                "unit": item.unit,
                "required": item.required,
                "min_value": item.min_value,
                "max_value": item.max_value,
                "options_json": item.options_json,
                "help_text": item.help_text
            } for item in checklist.items
        ]
    }

@router.post("/upload-evidence", response_model=AttachmentResponse)
def upload_evidence(
    application_id: int = Form(...),
    file_type: str = Form("PHOTO"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"]
    if ext not in allowed_exts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File extension {ext} not permitted. Allowed: {allowed_exts}")

    unique_filename = f"evidence_{app.id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(settings.STORAGE_DIR, unique_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(dest_path)

    attachment = Attachment(
        application_id=app.id,
        instrument_id=app.instrument_id,
        file_name=file.filename,
        file_path=f"/uploads/{unique_filename}",
        file_type=file_type,
        mime_type=file.content_type or "image/jpeg",
        file_size=file_size,
        uploaded_by_id=current_user.id,
        is_demo=True
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    log_audit_event(
        db=db,
        action="EVIDENCE_UPLOADED",
        description=f"Evidence {file.filename} ({file_type}) uploaded for Application {app.application_number} by {current_user.email}",
        user=current_user,
        entity_type="APPLICATION",
        entity_id=str(app.id)
    )

    return attachment

@router.post("/submit", response_model=VerificationResponse)
def submit_verification(
    verif_in: VerificationSubmitRequest,
    db: Session = Depends(get_db),
    current_verifier: User = Depends(get_current_verifier)
):
    app = db.query(Application).filter(Application.id == verif_in.application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # State validation
    if app.status not in [ApplicationStatus.ASSIGNED, ApplicationStatus.IN_FIELD_VERIFICATION]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit verification for application in '{app.status.value}' state."
        )

    inst = app.instrument
    rule_version = db.query(RuleVersion).filter(RuleVersion.id == verif_in.rule_version_id).first()
    if not rule_version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule version not found")

    # Deterministic rule evaluation
    checklist = db.query(Checklist).filter(
        Checklist.rule_version_id == rule_version.id,
        Checklist.category_id == inst.category_id
    ).first()
    if not checklist:
        checklist = db.query(Checklist).filter(Checklist.rule_version_id == rule_version.id).first()

    obs_dicts = [obs.model_dump() for obs in verif_in.observations]
    if checklist:
        all_compliant, issues = validate_observations(checklist, obs_dicts)
        if not all_compliant and verif_in.result == VerificationResult.VERIFIED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Verification cannot be marked VERIFIED because rule compliance failed: {'; '.join(issues)}"
            )

    # 1. Create Verification Event
    verif_event = VerificationEvent(
        application_id=app.id,
        instrument_id=inst.id,
        verifier_id=current_verifier.id,
        verifier_role=current_verifier.role.value,
        rule_version_id=rule_version.id,
        verification_date=datetime.now(timezone.utc),
        result=verif_in.result,
        verifier_remarks=verif_in.verifier_remarks,
        geo_latitude=verif_in.geo_latitude,
        geo_longitude=verif_in.geo_longitude,
        is_demo=True
    )
    db.add(verif_event)
    db.commit()
    db.refresh(verif_event)

    # 2. Record individual observations
    for obs_data in verif_in.observations:
        item = db.query(ChecklistItem).filter(ChecklistItem.id == obs_data.checklist_item_id).first()
        obs = Observation(
            verification_event_id=verif_event.id,
            checklist_item_id=obs_data.checklist_item_id,
            item_label=item.label if item else "Item Observation",
            item_type=item.field_type if item else "TEXT",
            value_entered=str(obs_data.value_entered),
            unit=obs_data.unit or (item.unit if item else None),
            is_compliant=obs_data.is_compliant,
            remarks=obs_data.remarks
        )
        db.add(obs)
    
    # Link any previously uploaded attachments for this application to this verification event
    db.query(Attachment).filter(
        Attachment.application_id == app.id,
        Attachment.verification_event_id == None
    ).update({"verification_event_id": verif_event.id})

    db.commit()

    # 3. Transition workflow state machine
    transition_application_status(
        db=db,
        application=app,
        target_status=ApplicationStatus.RESULT_SUBMITTED,
        actor=current_verifier,
        remarks=f"Verification result recorded: {verif_in.result.value}. Remarks: {verif_in.verifier_remarks}"
    )

    certificate = None
    if verif_in.result == VerificationResult.VERIFIED:
        # Transition to VERIFIED and then CERTIFICATE_ISSUED
        transition_application_status(
            db=db,
            application=app,
            target_status=ApplicationStatus.VERIFIED,
            actor=current_verifier,
            remarks="Instrument verified compliant with applicable checklist."
        )

        # Issue digital certificate with genuine PDF and QR code
        certificate = issue_certificate_for_event(
            db=db,
            verification_event=verif_event,
            issued_by=current_verifier,
            validity_months=inst.category.default_validity_months if inst.category else 12
        )

        transition_application_status(
            db=db,
            application=app,
            target_status=ApplicationStatus.CERTIFICATE_ISSUED,
            actor=current_verifier,
            remarks=f"Digital Verification Certificate {certificate.certificate_number} issued."
        )

        # Notify owner
        send_notification(
            db=db,
            user_id=inst.owner_id,
            title="Verification Successful — Certificate Issued",
            message=f"Digital Certificate {certificate.certificate_number} has been generated for {inst.manufacturer} {inst.model}.",
            notification_type="SUCCESS",
            link=f"/owner/certificates/{certificate.id}"
        )
    elif verif_in.result == VerificationResult.REJECTED:
        transition_application_status(
            db=db,
            application=app,
            target_status=ApplicationStatus.REJECTED,
            actor=current_verifier,
            remarks=f"Verification rejected. Remarks: {verif_in.verifier_remarks}"
        )
        send_notification(
            db=db,
            user_id=inst.owner_id,
            title="Verification Result: REJECTED",
            message=f"Instrument verification for {inst.instrument_id} was rejected. Please review verifier remarks and re-apply.",
            notification_type="ALERT",
            link=f"/owner/applications/{app.id}"
        )
    else:
        transition_application_status(
            db=db,
            application=app,
            target_status=ApplicationStatus.NEEDS_CORRECTION,
            actor=current_verifier,
            remarks=f"Verification requires administrative review/correction: {verif_in.verifier_remarks}"
        )

    log_audit_event(
        db=db,
        action="VERIFICATION_SUBMITTED",
        description=f"Verification event {verif_event.id} submitted for Application {app.application_number} with result {verif_in.result.value}",
        user=current_verifier,
        entity_type="VERIFICATION_EVENT",
        entity_id=str(verif_event.id)
    )

    db.refresh(verif_event)

    return {
        "id": verif_event.id,
        "application_id": verif_event.application_id,
        "instrument_id": verif_event.instrument_id,
        "verifier_id": verif_event.verifier_id,
        "verifier_name": current_verifier.full_name,
        "verifier_role": verif_event.verifier_role,
        "rule_version_id": verif_event.rule_version_id,
        "verification_date": verif_event.verification_date,
        "result": verif_event.result,
        "verifier_remarks": verif_event.verifier_remarks,
        "observations": [
            {
                "id": o.id,
                "checklist_item_id": o.checklist_item_id,
                "item_label": o.item_label,
                "item_type": o.item_type,
                "value_entered": o.value_entered,
                "unit": o.unit,
                "is_compliant": o.is_compliant,
                "remarks": o.remarks
            } for o in verif_event.observations
        ],
        "attachments": [
            {
                "id": a.id,
                "file_name": a.file_name,
                "file_path": a.file_path,
                "file_type": a.file_type,
                "mime_type": a.mime_type,
                "file_size": a.file_size,
                "created_at": a.created_at
            } for a in verif_event.attachments
        ],
        "certificate_id": certificate.id if certificate else None,
        "certificate_number": certificate.certificate_number if certificate else None,
        "created_at": verif_event.created_at
    }

@router.get("/{id}", response_model=VerificationResponse)
def get_verification(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verif = db.query(VerificationEvent).filter(VerificationEvent.id == id).first()
    if not verif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification event not found")

    return {
        "id": verif.id,
        "application_id": verif.application_id,
        "instrument_id": verif.instrument_id,
        "verifier_id": verif.verifier_id,
        "verifier_name": verif.verifier.full_name if verif.verifier else None,
        "verifier_role": verif.verifier_role,
        "rule_version_id": verif.rule_version_id,
        "verification_date": verif.verification_date,
        "result": verif.result,
        "verifier_remarks": verif.verifier_remarks,
        "observations": [
            {
                "id": o.id,
                "checklist_item_id": o.checklist_item_id,
                "item_label": o.item_label,
                "item_type": o.item_type,
                "value_entered": o.value_entered,
                "unit": o.unit,
                "is_compliant": o.is_compliant,
                "remarks": o.remarks
            } for o in verif.observations
        ],
        "attachments": [
            {
                "id": a.id,
                "file_name": a.file_name,
                "file_path": a.file_path,
                "file_type": a.file_type,
                "mime_type": a.mime_type,
                "file_size": a.file_size,
                "created_at": a.created_at
            } for a in verif.attachments
        ],
        "certificate_id": verif.certificate.id if verif.certificate else None,
        "certificate_number": verif.certificate.certificate_number if verif.certificate else None,
        "created_at": verif.created_at
    }
