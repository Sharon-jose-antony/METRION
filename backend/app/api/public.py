from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import CertificatePublicVerifyResponse
from app.services.certificate_service import verify_public_certificate

router = APIRouter(prefix="/public", tags=["Public Verification"])

@router.get("/certificates/verify/{token}", response_model=CertificatePublicVerifyResponse)
def verify_certificate_token(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else "unknown"
    status_str, safe_data = verify_public_certificate(
        db=db,
        qr_token=token,
        ip_address=ip_address
    )

    if not safe_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The scanned certificate QR token was not found in the official registry or is invalid."
        )

    return safe_data
