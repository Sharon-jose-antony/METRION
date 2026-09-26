from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.models import Checklist, ChecklistItem, RuleVersion, Observation

def get_active_checklist_for_category(db: Session, category_id: int) -> Tuple[RuleVersion, Checklist]:
    rule_version = db.query(RuleVersion).filter(RuleVersion.is_current == True).first()
    if not rule_version:
        raise ValueError("No active RuleVersion found in system.")
    
    checklist = db.query(Checklist).filter(
        Checklist.rule_version_id == rule_version.id,
        Checklist.category_id == category_id
    ).first()

    # Fallback to the first checklist if specific category checklist is pending
    if not checklist:
        checklist = db.query(Checklist).filter(
            Checklist.rule_version_id == rule_version.id
        ).first()

    return rule_version, checklist

def validate_observations(
    checklist: Checklist,
    observations_input: List[Dict[str, Any]]
) -> Tuple[bool, List[str]]:
    """
    Deterministic, explainable rule engine evaluation.
    Checks required items, numerical ranges, and non-compliance flags.
    Returns (all_compliant: bool, issues: List[str]).
    """
    items_map = {item.id: item for item in checklist.items}
    received_item_ids = {obs.get("checklist_item_id") for obs in observations_input}
    
    issues = []
    
    # Check for required items
    for item in checklist.items:
        if item.required and item.id not in received_item_ids:
            issues.append(f"Missing mandatory checklist observation: '{item.label}' ({item.code})")

    # Evaluate each observation
    all_compliant = True
    for obs in observations_input:
        item_id = obs.get("checklist_item_id")
        val = str(obs.get("value_entered", "")).strip()
        is_comp = obs.get("is_compliant", True)
        
        item = items_map.get(item_id)
        if not item:
            continue
            
        if item.field_type == "NUMBER":
            try:
                num_val = float(val)
                if item.min_value is not None and num_val < item.min_value:
                    issues.append(f"{item.label}: Reading {num_val} {item.unit or ''} is below permitted tolerance minimum {item.min_value}")
                    all_compliant = False
                if item.max_value is not None and num_val > item.max_value:
                    issues.append(f"{item.label}: Reading {num_val} {item.unit or ''} exceeds permitted tolerance maximum {item.max_value}")
                    all_compliant = False
            except ValueError:
                issues.append(f"{item.label}: Invalid numerical reading '{val}'")
                all_compliant = False
        elif item.field_type == "BOOLEAN":
            if val.lower() in ["false", "no", "fail", "failed"] or not is_comp:
                issues.append(f"{item.label}: Marked as NON-COMPLIANT by Verifier.")
                all_compliant = False

    return all_compliant, issues
