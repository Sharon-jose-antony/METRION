from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.models import AuditEvent, User
from app.schemas.schemas import AuditEventResponse

router = APIRouter(prefix="/audit-events", tags=["Audit Logs"])

@router.get("", response_model=List[AuditEventResponse])
def get_audit_logs(
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    query = db.query(AuditEvent)
    if action:
        query = query.filter(AuditEvent.action.ilike(f"%{action}%"))
    return query.order_by(AuditEvent.created_at.desc()).limit(limit).all()
