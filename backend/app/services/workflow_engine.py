from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.models import (
    Application, ApplicationStatus, ApplicationStatusHistory,
    Instrument, User, UserRole
)
from app.services.audit_service import log_audit_event
from app.services.notification_service import send_notification

# Allowed transitions map: Current Status -> List of permissible Next Statuses
ALLOWED_TRANSITIONS = {
    ApplicationStatus.DRAFT: [
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.CANCELLED
    ],
    ApplicationStatus.SUBMITTED: [
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.NEEDS_CORRECTION,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.CANCELLED
    ],
    ApplicationStatus.UNDER_REVIEW: [
        ApplicationStatus.NEEDS_CORRECTION,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.CANCELLED
    ],
    ApplicationStatus.NEEDS_CORRECTION: [
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.CANCELLED
    ],
    ApplicationStatus.ACCEPTED: [
        ApplicationStatus.SCHEDULED,
        ApplicationStatus.ASSIGNED,
        ApplicationStatus.CANCELLED
    ],
    ApplicationStatus.SCHEDULED: [
        ApplicationStatus.ASSIGNED,
        ApplicationStatus.IN_FIELD_VERIFICATION,
        ApplicationStatus.CANCELLED
    ],
    ApplicationStatus.ASSIGNED: [
        ApplicationStatus.IN_FIELD_VERIFICATION,
        ApplicationStatus.CANCELLED
    ],
    ApplicationStatus.IN_FIELD_VERIFICATION: [
        ApplicationStatus.RESULT_SUBMITTED
    ],
    ApplicationStatus.RESULT_SUBMITTED: [
        ApplicationStatus.VERIFIED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.NEEDS_CORRECTION,
        ApplicationStatus.CERTIFICATE_ISSUED
    ],
    ApplicationStatus.VERIFIED: [
        ApplicationStatus.CERTIFICATE_ISSUED
    ],
    ApplicationStatus.CERTIFICATE_ISSUED: [
        ApplicationStatus.EXPIRED,
        ApplicationStatus.RE_VERIFICATION_REQUIRED
    ],
    ApplicationStatus.REJECTED: [
        ApplicationStatus.RE_VERIFICATION_REQUIRED
    ],
    ApplicationStatus.EXPIRED: [
        ApplicationStatus.RE_VERIFICATION_REQUIRED
    ],
    ApplicationStatus.CANCELLED: [],
    ApplicationStatus.RE_VERIFICATION_REQUIRED: []
}

def can_transition(current: ApplicationStatus, target: ApplicationStatus) -> bool:
    allowed = ALLOWED_TRANSITIONS.get(current, [])
    return target in allowed

def transition_application_status(
    db: Session,
    application: Application,
    target_status: ApplicationStatus,
    actor: User,
    remarks: Optional[str] = None
) -> Application:
    current_status = application.status

    if current_status == target_status:
        return application

    if not can_transition(current_status, target_status):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Illegal state transition from {current_status.value} to {target_status.value}. "
                   f"Allowed transitions: {[s.value for s in ALLOWED_TRANSITIONS.get(current_status, [])]}"
        )

    # Update application status
    application.status = target_status
    
    # Record history
    history = ApplicationStatusHistory(
        application_id=application.id,
        from_status=current_status.value,
        to_status=target_status.value,
        actor_id=actor.id,
        actor_role=actor.role.value,
        remarks=remarks
    )
    db.add(history)

    # Sync instrument status where applicable
    instrument = application.instrument
    if target_status == ApplicationStatus.SUBMITTED:
        instrument.current_status = "APPLICATION_PENDING"
    elif target_status in [ApplicationStatus.SCHEDULED, ApplicationStatus.ASSIGNED]:
        instrument.current_status = "SCHEDULED"
    elif target_status == ApplicationStatus.IN_FIELD_VERIFICATION:
        instrument.current_status = "IN_FIELD_VERIFICATION"
    elif target_status == ApplicationStatus.CERTIFICATE_ISSUED:
        instrument.current_status = "VERIFIED"
    elif target_status == ApplicationStatus.REJECTED:
        instrument.current_status = "REJECTED"
    elif target_status == ApplicationStatus.EXPIRED:
        instrument.current_status = "EXPIRED"

    db.commit()
    db.refresh(application)

    # Log audit event
    log_audit_event(
        db=db,
        action="APPLICATION_STATUS_CHANGE",
        description=f"Application {application.application_number} transitioned from {current_status.value} to {target_status.value}. Remarks: {remarks or 'None'}",
        user=actor,
        entity_type="APPLICATION",
        entity_id=str(application.id)
    )

    # Send notification to instrument owner if actor is not the owner
    if actor.id != application.owner_id:
        send_notification(
            db=db,
            user_id=application.owner_id,
            title=f"Application {application.application_number} Update",
            message=f"Status changed to {target_status.value.replace('_', ' ').title()}.",
            notification_type="INFO",
            link=f"/owner/applications/{application.id}"
        )

    return application
