from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import AuditEvent, User

def log_audit_event(
    db: Session,
    action: str,
    description: str,
    user: Optional[User] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditEvent:
    event = AuditEvent(
        user_id=user.id if user else None,
        user_email=user.email if user else "PUBLIC/SYSTEM",
        user_role=user.role.value if user else "PUBLIC",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
