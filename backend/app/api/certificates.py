import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import Certificate, CertificateStatus, User, UserRole
from app.schemas.schemas import CertificateResponse, CertificateRevokeRequest
from app.services.certificate_service import revoke_certificate

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.get("", response_model=List[CertificateResponse])
def list_certificates(
    status_filter: Optional[CertificateStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Certificate)

    if current_user.role == UserRole.INSTRUMENT_OWNER:
        query = query.filter(Certificate.issued_to_owner_id == current_user.id)

    if status_filter:
        query = query.filter(Certificate.status == status_filter)

    certificates = query.order_by(Certificate.issue_date.desc()).all()

    result = []
    for c in certificates:
        inst = c.instrument
        result.append({
            "id": c.id,
            "certificate_number": c.certificate_number,
            "qr_token": c.qr_token,
            "instrument_id": c.instrument_id,
            "instrument_permanent_id": inst.instrument_id if inst else None,
            "category_name": inst.category.name if (inst and inst.category) else None,
            "manufacturer": inst.manufacturer if inst else None,
            "model": inst.model if inst else None,
            "serial_number": inst.serial_number if inst else None,
            "owner_name": c.issued_to.full_name if c.issued_to else None,
            "application_id": c.application_id,
            "verification_event_id": c.verification_event_id,
            "issuing_authority_name": c.issuing_authority_name,
            "verifier_name": c.issued_by.full_name if c.issued_by else None,
            "issue_date": c.issue_date,
            "valid_until_date": c.valid_until_date,
            "status": c.status,
            "pdf_url": f"/api/certificates/{c.id}/pdf" if c.pdf_path else None,
            "is_demo": c.is_demo,
            "created_at": c.created_at
        })
    return result

@router.get("/{id}", response_model=CertificateResponse)
def get_certificate(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Certificate).filter(Certificate.id == id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

    if current_user.role == UserRole.INSTRUMENT_OWNER and c.issued_to_owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    inst = c.instrument
    return {
        "id": c.id,
        "certificate_number": c.certificate_number,
        "qr_token": c.qr_token,
        "instrument_id": c.instrument_id,
        "instrument_permanent_id": inst.instrument_id if inst else None,
        "category_name": inst.category.name if (inst and inst.category) else None,
        "manufacturer": inst.manufacturer if inst else None,
        "model": inst.model if inst else None,
        "serial_number": inst.serial_number if inst else None,
        "owner_name": c.issued_to.full_name if c.issued_to else None,
        "application_id": c.application_id,
        "verification_event_id": c.verification_event_id,
        "issuing_authority_name": c.issuing_authority_name,
        "verifier_name": c.issued_by.full_name if c.issued_by else None,
        "issue_date": c.issue_date,
        "valid_until_date": c.valid_until_date,
        "status": c.status,
        "pdf_url": f"/api/certificates/{c.id}/pdf" if c.pdf_path else None,
        "is_demo": c.is_demo,
        "created_at": c.created_at
    }

@router.get("/{id}/pdf")
def download_certificate_pdf(
    id: int,
    db: Session = Depends(get_db)
):
    c = db.query(Certificate).filter(Certificate.id == id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

    from app.services.certificate_service import generate_certificate_pdf
    inst = c.instrument
    verifier = c.issued_by
    owner = c.issued_to
    # Always generate freshly to guarantee latest online QR code
    c.pdf_path = generate_certificate_pdf(c, inst, verifier, owner)
    db.commit()

    return FileResponse(
        path=c.pdf_path,
        filename=f"Metrion_Certificate_{c.certificate_number}.pdf",
        media_type="application/pdf"
    )

@router.post("/refresh-all-pdfs")
def refresh_all_certificate_pdfs_endpoint(db: Session = Depends(get_db)):
    """
    Public/Admin utility endpoint to regenerate all certificate PDFs with online QR code.
    """
    from app.services.certificate_service import regenerate_all_certificate_pdfs
    count = regenerate_all_certificate_pdfs(db)
    return {"status": "success", "regenerated_count": count, "message": f"Successfully regenerated {count} certificate PDFs with online GitHub Pages QR codes."}


@router.post("/{id}/revoke", response_model=CertificateResponse)
def revoke_certificate_endpoint(
    id: int,
    revoke_in: CertificateRevokeRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    try:
        updated_cert = revoke_certificate(
            db=db,
            certificate_id=id,
            revocation_reason=revoke_in.revocation_reason,
            revoked_by=current_admin
        )
        return get_certificate(id=updated_cert.id, db=db, current_user=current_admin)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
