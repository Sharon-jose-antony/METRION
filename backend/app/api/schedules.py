from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import (
    Schedule, Assignment, Application, ApplicationStatus, User, UserRole
)
from app.schemas.schemas import ScheduleCreate, ScheduleResponse
from app.services.workflow_engine import transition_application_status
from app.services.audit_service import log_audit_event
from app.services.notification_service import send_notification

router = APIRouter(prefix="/schedules", tags=["Scheduling"])

@router.post("", response_model=ScheduleResponse)
def create_schedule(
    sched_in: ScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    app = db.query(Application).filter(Application.id == sched_in.application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # Verify that assigned user exists and has appropriate role (LMO or GATC)
    assignee = db.query(User).filter(User.id == sched_in.assigned_to_user_id).first()
    if not assignee or assignee.role not in [UserRole.LMO, UserRole.GATC]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned verifier must be an active Legal Metrology Officer (LMO) or Government Approved Test Centre (GATC)."
        )

    # If application is in ACCEPTED or SUBMITTED, transition to SCHEDULED
    if app.status in [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW]:
        transition_application_status(
            db=db,
            application=app,
            target_status=ApplicationStatus.ACCEPTED,
            actor=current_admin,
            remarks="Application accepted for field verification scheduling."
        )

    # Check if schedule already exists or update
    existing_sched = db.query(Schedule).filter(Schedule.application_id == app.id).first()
    if existing_sched:
        existing_sched.scheduled_date = sched_in.scheduled_date
        existing_sched.time_window = sched_in.time_window
        existing_sched.location_address = sched_in.location_address
        existing_sched.notes = sched_in.notes
        schedule = existing_sched
    else:
        schedule = Schedule(
            application_id=app.id,
            scheduled_date=sched_in.scheduled_date,
            time_window=sched_in.time_window,
            location_address=sched_in.location_address,
            notes=sched_in.notes,
            created_by_id=current_admin.id
        )
        db.add(schedule)
    
    db.commit()
    db.refresh(schedule)

    # Transition to SCHEDULED
    transition_application_status(
        db=db,
        application=app,
        target_status=ApplicationStatus.SCHEDULED,
        actor=current_admin,
        remarks=f"Verification scheduled on {sched_in.scheduled_date.strftime('%d-%b-%Y')} ({sched_in.time_window})"
    )

    # Create/update assignment
    existing_assignment = db.query(Assignment).filter(Assignment.application_id == app.id).first()
    if existing_assignment:
        existing_assignment.schedule_id = schedule.id
        existing_assignment.assigned_to_type = sched_in.assign_to_type
        existing_assignment.assigned_to_user_id = assignee.id
        existing_assignment.assigned_by_id = current_admin.id
        existing_assignment.status = "ASSIGNED"
    else:
        new_assignment = Assignment(
            schedule_id=schedule.id,
            application_id=app.id,
            assigned_to_type=sched_in.assign_to_type,
            assigned_to_user_id=assignee.id,
            assigned_by_id=current_admin.id,
            status="ASSIGNED"
        )
        db.add(new_assignment)

    # Transition to ASSIGNED
    transition_application_status(
        db=db,
        application=app,
        target_status=ApplicationStatus.ASSIGNED,
        actor=current_admin,
        remarks=f"Assigned to {assignee.full_name} ({sched_in.assign_to_type})."
    )

    db.commit()
    db.refresh(schedule)

    # Send notification to assigned verifier
    send_notification(
        db=db,
        user_id=assignee.id,
        title="New Field Verification Case Assigned",
        message=f"Case {app.application_number} assigned for verification on {sched_in.scheduled_date.strftime('%d-%b-%Y')}.",
        notification_type="ALERT",
        link=f"/lmo/verification/{app.id}" if assignee.role == UserRole.LMO else f"/gatc/verification/{app.id}"
    )

    log_audit_event(
        db=db,
        action="VERIFICATION_SCHEDULED_AND_ASSIGNED",
        description=f"Application {app.application_number} scheduled for {sched_in.scheduled_date} and assigned to {assignee.email}",
        user=current_admin,
        entity_type="SCHEDULE",
        entity_id=str(schedule.id)
    )

    return schedule

@router.get("", response_model=List[ScheduleResponse])
def list_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Schedule)
    if current_user.role in [UserRole.LMO, UserRole.GATC]:
        query = query.join(Assignment, Schedule.id == Assignment.schedule_id)\
                     .filter(Assignment.assigned_to_user_id == current_user.id)
    return query.order_by(Schedule.scheduled_date.asc()).all()
