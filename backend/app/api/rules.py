from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Rule, RuleVersion, Checklist, ChecklistItem
from app.schemas.schemas import RuleVersionResponse, ChecklistResponse

router = APIRouter(prefix="/rules", tags=["Rule Engine & Checklists"])

@router.get("")
def list_rules(db: Session = Depends(get_db)):
    rules = db.query(Rule).all()
    result = []
    for r in rules:
        versions = []
        for v in r.versions:
            versions.append({
                "id": v.id,
                "version_number": v.version_number,
                "effective_from": v.effective_from,
                "effective_to": v.effective_to,
                "is_current": v.is_current,
                "statutory_disclaimer": v.statutory_disclaimer,
                "checklists_count": len(v.checklists)
            })
        result.append({
            "id": r.id,
            "name": r.name,
            "reference_code": r.reference_code,
            "jurisdiction": r.jurisdiction,
            "is_active": r.is_active,
            "versions": versions
        })
    return result

@router.get("/versions/current", response_model=RuleVersionResponse)
def get_current_rule_version(db: Session = Depends(get_db)):
    rv = db.query(RuleVersion).filter(RuleVersion.is_current == True).first()
    if not rv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active rule version found")
    return rv

@router.get("/checklists", response_model=List[ChecklistResponse])
def list_checklists(db: Session = Depends(get_db)):
    return db.query(Checklist).all()
