from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import Assignment, Application, Schedule, Instrument, User, UserRole

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.get("")
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Assignment)

    # Verifiers only see assignments allocated to them
    if current_user.role in [UserRole.LMO, UserRole.GATC]:
        query = query.filter(Assignment.assigned_to_user_id == current_user.id)

    assignments = query.order_by(Assignment.created_at.desc()).all()

    result = []
    for a in assignments:
        app = a.application
        inst = app.instrument if app else None
        sched = a.schedule
        result.append({
            "id": a.id,
            "application_id": a.application_id,
            "application_number": app.application_number if app else None,
            "application_status": app.status.value if app else None,
            "instrument_id": inst.instrument_id if inst else None,
            "instrument_name": f"{inst.manufacturer} {inst.model}" if inst else None,
            "instrument_category": inst.category.name if (inst and inst.category) else None,
            "serial_number": inst.serial_number if inst else None,
            "owner_name": inst.owner.full_name if (inst and inst.owner) else None,
            "owner_phone": inst.owner.phone if (inst and inst.owner) else None,
            "location_address": sched.location_address if sched else (inst.installation_address if inst else None),
            "scheduled_date": sched.scheduled_date if sched else None,
            "time_window": sched.time_window if sched else None,
            "assigned_to_name": a.assigned_to.full_name if a.assigned_to else None,
            "assigned_to_type": a.assigned_to_type,
            "status": a.status,
            "created_at": a.created_at
        })
    return result
