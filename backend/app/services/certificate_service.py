import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import qrcode
from io import BytesIO
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.core.config import settings
from app.models.models import (
    Certificate, CertificateStatus, CertificateEvent,
    Instrument, Application, VerificationEvent, User
)
from app.services.audit_service import log_audit_event

def generate_certificate_number(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Certificate).count() + 1
    return f"LM-CERT-{year}-{count:06d}"

def generate_qr_token() -> str:
    return uuid.uuid4().hex

def generate_certificate_pdf(
    certificate: Certificate,
    instrument: Instrument,
    verifier: User,
    owner: User
) -> str:
    """
    Generates an official-looking, high-resolution PDF certificate with embedded QR code.
    Saves it to local uploads directory and returns the relative/absolute file path.
    """
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    pdf_filename = f"cert_{certificate.certificate_number}.pdf"
    pdf_path = os.path.join(settings.STORAGE_DIR, pdf_filename)
    
    # 1. Generate QR Code image in memory
    qr_data = f"{settings.PUBLIC_BASE_URL}/verify/{certificate.qr_token}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0F1E36", back_color="white")
    
    qr_temp_path = os.path.join(settings.STORAGE_DIR, f"qr_{certificate.qr_token}.png")
    qr_img.save(qr_temp_path)

    # 2. Build PDF Document with ReportLab
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'GovTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0B2545'),
        alignment=1
    )
    
    sub_title_style = ParagraphStyle(
        'GovSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E507B'),
        alignment=1
    )

    demo_badge_style = ParagraphStyle(
        'DemoBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#B45309'),
        alignment=1
    )
    
    label_style = ParagraphStyle(
        'FieldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1E293B')
    )
    
    value_style = ParagraphStyle(
        'FieldValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )

    story = []

    # Header section
    story.append(Paragraph("METRION", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("DIGITAL VERIFICATION CERTIFICATE", sub_title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("— DEMO RECORD FOR SIH26036 EVALUATION —", demo_badge_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0B2545'), spaceAfter=15))

    # Certificate Main Info
    cert_meta_data = [
        [
            Paragraph("<b>Certificate Number:</b>", label_style),
            Paragraph(f"<font color='#0B2545'><b>{certificate.certificate_number}</b></font>", value_style),
            Paragraph("<b>Issue Date:</b>", label_style),
            Paragraph(certificate.issue_date.strftime("%d-%b-%Y"), value_style)
        ],
        [
            Paragraph("<b>Status:</b>", label_style),
            Paragraph(f"<font color='#059669'><b>{certificate.status.value}</b></font>", value_style),
            Paragraph("<b>Valid Until / Due:</b>", label_style),
            Paragraph(f"<b>{certificate.valid_until_date.strftime('%d-%b-%Y')}</b>", value_style)
        ]
    ]
    meta_table = Table(cert_meta_data, colWidths=[120, 150, 110, 140])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # Instrument Details Table
    story.append(Paragraph("<b>1. VERIFIED INSTRUMENT PARTICULARS</b>", sub_title_style))
    story.append(Spacer(1, 6))

    inst_data = [
        [Paragraph("Permanent Instrument ID", label_style), Paragraph(instrument.instrument_id, value_style)],
        [Paragraph("Instrument Category", label_style), Paragraph(instrument.category.name if instrument.category else "Weighing Instrument", value_style)],
        [Paragraph("Manufacturer & Model", label_style), Paragraph(f"{instrument.manufacturer} — {instrument.model}", value_style)],
        [Paragraph("Serial Number", label_style), Paragraph(instrument.serial_number, value_style)],
        [Paragraph("Capacity & Accuracy Class", label_style), Paragraph(f"{instrument.capacity or 'N/A'} | {instrument.accuracy_class or 'Class III'}", value_style)],
        [Paragraph("Owner / Registered Business", label_style), Paragraph(owner.full_name, value_style)],
        [Paragraph("Installation Address", label_style), Paragraph(f"{instrument.installation_address}, {instrument.district}, {instrument.state} - {instrument.pincode or ''}", value_style)],
    ]
    inst_table = Table(inst_data, colWidths=[160, 360])
    inst_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F1F5F9')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(inst_table)
    story.append(Spacer(1, 14))

    # Verification Details & QR Code section
    story.append(Paragraph("<b>2. STATUTORY VERIFICATION & AUTHENTICATION</b>", sub_title_style))
    story.append(Spacer(1, 6))

    qr_image_flowable = Image(qr_temp_path, width=1.4*inch, height=1.4*inch)
    
    verif_details_data = [
        [
            Paragraph("<b>Issuing Authority:</b><br/>" + certificate.issuing_authority_name, value_style),
            qr_image_flowable
        ],
        [
            Paragraph(f"<b>Authorized Verifier:</b> {verifier.full_name} ({verifier.role.value})<br/>"
                      f"<b>Verification Date:</b> {certificate.issue_date.strftime('%d-%b-%Y %H:%M UTC')}<br/>"
                      f"<b>Official Seal / Stamp:</b> Digitally Authenticated & Stamped<br/>"
                      f"<i>Scan the QR code to verify live certificate validity.</i>", value_style),
            Paragraph("<font size='7' color='#475569'>Scan with any smartphone or camera to access live government registry record</font>", disclaimer_style)
        ]
    ]
    verif_table = Table(verif_details_data, colWidths=[380, 140])
    verif_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#0B2545')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
    ]))
    story.append(verif_table)
    story.append(Spacer(1, 20))

    # Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))
    story.append(Paragraph(
        "<b>LEGAL DISCLAIMER:</b> This prototype certificate is generated for demonstration and evaluation purposes under "
        "Smart India Hackathon 2026 (SIH26036). It does not constitute a physical statutory determination. "
        "Physical verification remains the statutory duty of authorized Legal Metrology Officers.",
        disclaimer_style
    ))

    # Build the document
    doc.build(story)
    
    # Clean up temporary QR image file
    try:
        if os.path.exists(qr_temp_path):
            os.remove(qr_temp_path)
    except Exception:
        pass

    return pdf_path

def issue_certificate_for_event(
    db: Session,
    verification_event: VerificationEvent,
    issued_by: User,
    validity_months: Optional[int] = None
) -> Certificate:
    """
    Creates a new digital certificate linked to the permanent instrument and application.
    """
    instrument = verification_event.instrument
    application = verification_event.application
    owner = instrument.owner

    if validity_months is None:
        validity_months = instrument.category.default_validity_months if instrument.category else 12

    cert_num = generate_certificate_number(db)
    qr_token = generate_qr_token()
    now = datetime.now(timezone.utc)
    valid_until = now + timedelta(days=validity_months * 30)

    certificate = Certificate(
        certificate_number=cert_num,
        qr_token=qr_token,
        instrument_id=instrument.id,
        application_id=application.id,
        verification_event_id=verification_event.id,
        issued_to_owner_id=owner.id,
        issued_by_user_id=issued_by.id,
        issuing_authority_name="Department of Legal Metrology (Demo Authority)",
        issue_date=now,
        valid_until_date=valid_until,
        status=CertificateStatus.VALID,
        is_demo=True
    )
    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    # Generate PDF
    pdf_path = generate_certificate_pdf(
        certificate=certificate,
        instrument=instrument,
        verifier=issued_by,
        owner=owner
    )
    certificate.pdf_path = pdf_path

    # Set as active certificate on instrument
    instrument.active_certificate_id = certificate.id
    instrument.current_status = "VERIFIED"

    # Log Certificate Event
    event = CertificateEvent(
        certificate_id=certificate.id,
        event_type="GENERATED",
        actor_info=f"{issued_by.full_name} ({issued_by.role.value})"
    )
    db.add(event)
    db.commit()
    db.refresh(certificate)

    # Audit event
    log_audit_event(
        db=db,
        action="CERTIFICATE_ISSUED",
        description=f"Certificate {certificate.certificate_number} issued for Instrument {instrument.instrument_id}",
        user=issued_by,
        entity_type="CERTIFICATE",
        entity_id=str(certificate.id)
    )

    return certificate

def verify_public_certificate(
    db: Session,
    qr_token: str,
    ip_address: Optional[str] = None
) -> Tuple[str, Optional[dict]]:
    """
    Public QR verification service.
    Returns (status, safe_dict).
    Never exposes owner private details.
    """
    cert = db.query(Certificate).filter(Certificate.qr_token == qr_token).first()
    if not cert:
        return "INVALID", None

    now = datetime.now(timezone.utc)
    
    # Check expiry
    status_str = cert.status.value
    if cert.status == CertificateStatus.VALID and cert.valid_until_date:
        # Check if expired
        cert_valid_until = cert.valid_until_date
        if cert_valid_until.tzinfo is None:
            cert_valid_until = cert_valid_until.replace(tzinfo=timezone.utc)
        if now > cert_valid_until:
            status_str = "EXPIRED"

    # Log public QR scan event
    event = CertificateEvent(
        certificate_id=cert.id,
        event_type="QR_VERIFIED",
        actor_info="PUBLIC_SCANNER",
        ip_address=ip_address
    )
    db.add(event)
    db.commit()

    inst = cert.instrument
    # Mask serial number (show only last 4 chars)
    serial = inst.serial_number if inst else ""
    masked_serial = f"****{serial[-4:]}" if len(serial) > 4 else serial

    safe_info = {
        "authenticity_status": status_str,
        "is_authentic": status_str in ["VALID", "EXPIRED"],
        "certificate_number": cert.certificate_number,
        "instrument_id": inst.instrument_id if inst else "N/A",
        "instrument_category": inst.category.name if (inst and inst.category) else "Standard Instrument",
        "manufacturer": inst.manufacturer if inst else "N/A",
        "model": inst.model if inst else "N/A",
        "serial_number_masked": masked_serial,
        "verification_date": cert.issue_date,
        "valid_until_date": cert.valid_until_date,
        "status": cert.status,
        "issuing_authority": cert.issuing_authority_name,
        "verifier_role": cert.issued_by.role.value if cert.issued_by else "LMO",
        "verifier_name": cert.issued_by.full_name if cert.issued_by else "Authorized LMO",
        "verification_timestamp": now,
        "disclaimer": settings.DEMO_DISCLAIMER
    }
    return status_str, safe_info

def revoke_certificate(
    db: Session,
    certificate_id: int,
    revocation_reason: str,
    revoked_by: User
) -> Certificate:
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise ValueError("Certificate not found")
    if cert.status == CertificateStatus.REVOKED:
        raise ValueError("Certificate has already been revoked")

    cert.status = CertificateStatus.REVOKED
    cert.revocation_reason = revocation_reason
    cert.revoked_at = datetime.now(timezone.utc)
    cert.revoked_by_id = revoked_by.id

    # If this was active certificate on the instrument, mark instrument status
    if cert.instrument and cert.instrument.active_certificate_id == cert.id:
        cert.instrument.current_status = "CERTIFICATE_REVOKED"

    event = CertificateEvent(
        certificate_id=cert.id,
        event_type="REVOKED",
        actor_info=f"Revoked by {revoked_by.full_name} ({revoked_by.role.value}): {revocation_reason}"
    )
    db.add(event)
    db.commit()
    db.refresh(cert)

    log_audit_event(
        db=db,
        action="CERTIFICATE_REVOKED",
        description=f"Certificate {cert.certificate_number} revoked. Reason: {revocation_reason}",
        user=revoked_by,
        entity_type="CERTIFICATE",
        entity_id=str(cert.id)
    )

    return cert
