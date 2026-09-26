from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import (
    Application, ApplicationType, ApplicationStatus, ApplicationStatusHistory,
    Instrument, Schedule, Assignment, Certificate, User, UserRole
)
from app.schemas.schemas import (
    ApplicationCreate, ApplicationReviewRequest, ApplicationResponse,
    ApplicationStatusHistoryResponse
)
from app.services.workflow_engine import transition_application_status
from app.services.audit_service import log_audit_event
from app.services.notification_service import send_notification

router = APIRouter(prefix="/applications", tags=["Applications"])

def generate_application_number(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Application).count() + 1
    return f"LM-APP-{year}-{count:06d}"

@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    status_filter: Optional[ApplicationStatus] = None,
    instrument_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Application)

    if current_user.role == UserRole.INSTRUMENT_OWNER:
        query = query.filter(Application.owner_id == current_user.id)
    elif current_user.role in [UserRole.LMO, UserRole.GATC]:
        # Filter applications assigned to this verifier
        query = query.join(Assignment, Application.id == Assignment.application_id)\
                     .filter(Assignment.assigned_to_user_id == current_user.id)

    if status_filter:
        query = query.filter(Application.status == status_filter)
    if instrument_id:
        query = query.filter(Application.instrument_id == instrument_id)

    applications = query.order_by(Application.created_at.desc()).all()

    result = []
    for app in applications:
        inst = app.instrument
        cat = inst.category if inst else None
        
        # Build schedule dict
        sched_data = None
        if app.schedule:
            sched_data = {
                "id": app.schedule.id,
                "scheduled_date": app.schedule.scheduled_date,
                "time_window": app.schedule.time_window,
                "location_address": app.schedule.location_address,
                "notes": app.schedule.notes
            }
        
        # Build assignment dict
        assign_data = None
        if app.assignment:
            assign_data = {
                "id": app.assignment.id,
                "assigned_to_type": app.assignment.assigned_to_type,
                "assigned_to_user_id": app.assignment.assigned_to_user_id,
                "assigned_to_name": app.assignment.assigned_to.full_name if app.assignment.assigned_to else None,
                "status": app.assignment.status
            }

        # Build certificate dict
        cert_data = None
        if app.certificate:
            cert_data = {
                "id": app.certificate.id,
                "certificate_number": app.certificate.certificate_number,
                "qr_token": app.certificate.qr_token,
                "status": app.certificate.status.value,
                "issue_date": app.certificate.issue_date,
                "valid_until_date": app.certificate.valid_until_date
            }

        result.append({
            "id": app.id,
            "application_number": app.application_number,
            "instrument_id": app.instrument_id,
            "instrument_permanent_id": inst.instrument_id if inst else None,
            "instrument_name": f"{inst.manufacturer} {inst.model}" if inst else None,
            "instrument_category": cat.name if cat else None,
            "owner_id": app.owner_id,
            "owner_name": app.owner.full_name if app.owner else None,
            "application_type": app.application_type,
            "status": app.status,
            "proposed_date": app.proposed_date,
            "remarks": app.remarks,
            "review_notes": app.review_notes,
            "created_at": app.created_at,
            "updated_at": app.updated_at,
            "status_history": [
                {
                    "id": h.id,
                    "from_status": h.from_status,
                    "to_status": h.to_status,
                    "actor_role": h.actor_role,
                    "remarks": h.remarks,
                    "created_at": h.created_at
                } for h in app.status_history
            ],
            "schedule": sched_data,
            "assignment": assign_data,
            "certificate": cert_data
        })
    return result

@router.post("", response_model=ApplicationResponse)
def create_application(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inst = db.query(Instrument).filter(Instrument.id == app_in.instrument_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instrument not found")

    if current_user.role == UserRole.INSTRUMENT_OWNER and inst.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot apply for verification of another owner's instrument")

    # Check if there is already an active in-progress application for this instrument
    active_app = db.query(Application).filter(
        Application.instrument_id == inst.id,
        Application.status.in_([
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.ACCEPTED,
            ApplicationStatus.SCHEDULED,
            ApplicationStatus.ASSIGNED,
            ApplicationStatus.IN_FIELD_VERIFICATION,
            ApplicationStatus.RESULT_SUBMITTED
        ])
    ).first()
    if active_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An active application ({active_app.application_number}) is already in progress for this instrument."
        )

    app_num = generate_application_number(db)
    new_app = Application(
        application_number=app_num,
        instrument_id=inst.id,
        owner_id=current_user.id,
        application_type=app_in.application_type,
        status=ApplicationStatus.SUBMITTED,  # Direct submission from verified owner
        proposed_date=app_in.proposed_date,
        remarks=app_in.remarks,
        is_demo=True
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Initial status history
    history = ApplicationStatusHistory(
        application_id=new_app.id,
        from_status=None,
        to_status=ApplicationStatus.SUBMITTED.value,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        remarks="Verification application submitted by instrument owner."
    )
    db.add(history)

    # Update instrument status
    inst.current_status = "APPLICATION_PENDING"
    db.commit()
    db.refresh(new_app)

    log_audit_event(
        db=db,
        action="APPLICATION_SUBMITTED",
        description=f"Application {new_app.application_number} ({new_app.application_type.value}) submitted for instrument {inst.instrument_id} by {current_user.email}",
        user=current_user,
        entity_type="APPLICATION",
        entity_id=str(new_app.id)
    )

    return {
        "id": new_app.id,
        "application_number": new_app.application_number,
        "instrument_id": new_app.instrument_id,
        "instrument_permanent_id": inst.instrument_id,
        "instrument_name": f"{inst.manufacturer} {inst.model}",
        "instrument_category": inst.category.name if inst.category else None,
        "owner_id": new_app.owner_id,
        "owner_name": current_user.full_name,
        "application_type": new_app.application_type,
        "status": new_app.status,
        "proposed_date": new_app.proposed_date,
        "remarks": new_app.remarks,
        "review_notes": new_app.review_notes,
        "created_at": new_app.created_at,
        "updated_at": new_app.updated_at,
        "status_history": [
            {
                "id": history.id,
                "from_status": None,
                "to_status": history.to_status,
                "actor_role": history.actor_role,
                "remarks": history.remarks,
                "created_at": history.created_at
            }
        ],
        "schedule": None,
        "assignment": None,
        "certificate": None
    }

@router.get("/{id}", response_model=ApplicationResponse)
def get_application(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.role == UserRole.INSTRUMENT_OWNER and app.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    inst = app.instrument
    cat = inst.category if inst else None

    sched_data = None
    if app.schedule:
        sched_data = {
            "id": app.schedule.id,
            "scheduled_date": app.schedule.scheduled_date,
            "time_window": app.schedule.time_window,
            "location_address": app.schedule.location_address,
            "notes": app.schedule.notes
        }

    assign_data = None
    if app.assignment:
        assign_data = {
            "id": app.assignment.id,
            "assigned_to_type": app.assignment.assigned_to_type,
            "assigned_to_user_id": app.assignment.assigned_to_user_id,
            "assigned_to_name": app.assignment.assigned_to.full_name if app.assignment.assigned_to else None,
            "status": app.assignment.status
        }

    cert_data = None
    if app.certificate:
        cert_data = {
            "id": app.certificate.id,
            "certificate_number": app.certificate.certificate_number,
            "qr_token": app.certificate.qr_token,
            "status": app.certificate.status.value,
            "issue_date": app.certificate.issue_date,
            "valid_until_date": app.certificate.valid_until_date
        }

    return {
        "id": app.id,
        "application_number": app.application_number,
        "instrument_id": app.instrument_id,
        "instrument_permanent_id": inst.instrument_id if inst else None,
        "instrument_name": f"{inst.manufacturer} {inst.model}" if inst else None,
        "instrument_category": cat.name if cat else None,
        "owner_id": app.owner_id,
        "owner_name": app.owner.full_name if app.owner else None,
        "application_type": app.application_type,
        "status": app.status,
        "proposed_date": app.proposed_date,
        "remarks": app.remarks,
        "review_notes": app.review_notes,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "status_history": [
            {
                "id": h.id,
                "from_status": h.from_status,
                "to_status": h.to_status,
                "actor_role": h.actor_role,
                "remarks": h.remarks,
                "created_at": h.created_at
            } for h in app.status_history
        ],
        "schedule": sched_data,
        "assignment": assign_data,
        "certificate": cert_data
    }

@router.post("/{id}/review", response_model=ApplicationResponse)
def review_application(
    id: int,
    review_in: ApplicationReviewRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app.review_notes = review_in.review_notes
    app.reviewed_by_id = current_admin.id

    updated_app = transition_application_status(
        db=db,
        application=app,
        target_status=review_in.status,
        actor=current_admin,
        remarks=review_in.review_notes or f"Application marked as {review_in.status.value} by Admin."
    )
    return get_application(id=updated_app.id, db=db, current_user=current_admin)
