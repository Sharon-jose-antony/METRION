import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    INSTRUMENT_OWNER = "INSTRUMENT_OWNER"
    LMO = "LMO"
    GATC = "GATC"

class OrgType(str, enum.Enum):
    BUSINESS = "BUSINESS"
    LMO_OFFICE = "LMO_OFFICE"
    GATC = "GATC"
    ADMIN_DEPT = "ADMIN_DEPT"

class ApplicationType(str, enum.Enum):
    NEW_VERIFICATION = "NEW_VERIFICATION"
    RE_VERIFICATION = "RE_VERIFICATION"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    NEEDS_CORRECTION = "NEEDS_CORRECTION"
    ACCEPTED = "ACCEPTED"
    SCHEDULED = "SCHEDULED"
    ASSIGNED = "ASSIGNED"
    IN_FIELD_VERIFICATION = "IN_FIELD_VERIFICATION"
    RESULT_SUBMITTED = "RESULT_SUBMITTED"
    VERIFIED = "VERIFIED"
    CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    RE_VERIFICATION_REQUIRED = "RE_VERIFICATION_REQUIRED"

class VerificationResult(str, enum.Enum):
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class CertificateStatus(str, enum.Enum):
    ISSUED = "ISSUED"
    VALID = "VALID"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    org_type = Column(SQLEnum(OrgType), default=OrgType.BUSINESS)
    registration_number = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String(100), nullable=False, default="Delhi")
    district = Column(String(100), nullable=False, default="Central Delhi")
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    users = relationship("User", back_populates="organization")
    instruments = relationship("Instrument", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.INSTRUMENT_OWNER, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    designation = Column(String(150), nullable=True)
    jurisdiction_state = Column(String(100), nullable=True)
    jurisdiction_district = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="users")
    instruments = relationship("Instrument", back_populates="owner")
    applications = relationship("Application", foreign_keys="Application.owner_id", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")

class InstrumentCategory(Base):
    __tablename__ = "instrument_categories"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)  # e.g., NAWI, WEIGHBRIDGE, FUEL_DISPENSER
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    default_validity_months = Column(Integer, default=12)  # Demo reminder configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    instruments = relationship("Instrument", back_populates="category")
    checklists = relationship("Checklist", back_populates="category")

class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(String(50), unique=True, index=True, nullable=False)  # Permanent ID: LM-INST-000001
    category_id = Column(Integer, ForeignKey("instrument_categories.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    manufacturer = Column(String(200), nullable=False)
    model = Column(String(200), nullable=False)
    serial_number = Column(String(150), nullable=False, index=True)
    capacity = Column(String(100), nullable=True)  # e.g., "50 kg", "100 Ton"
    accuracy_class = Column(String(100), nullable=True)  # e.g., "Class III", "Class II"
    year_of_manufacture = Column(Integer, nullable=True)
    
    installation_address = Column(Text, nullable=False)
    state = Column(String(100), nullable=False, default="Delhi")
    district = Column(String(100), nullable=False, default="Central Delhi")
    pincode = Column(String(20), nullable=True)
    
    current_status = Column(String(50), default="REGISTERED")  # REGISTERED, APPLICATION_PENDING, SCHEDULED, VERIFIED, EXPIRED, etc.
    active_certificate_id = Column(Integer, nullable=True)
    
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    owner = relationship("User", back_populates="instruments")
    organization = relationship("Organization", back_populates="instruments")
    category = relationship("InstrumentCategory", back_populates="instruments")
    applications = relationship("Application", back_populates="instrument", cascade="all, delete-orphan")
    verification_events = relationship("VerificationEvent", back_populates="instrument")
    certificates = relationship("Certificate", back_populates="instrument")
    attachments = relationship("Attachment", back_populates="instrument")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, index=True, nullable=False)  # LM-APP-2026-000001
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    application_type = Column(SQLEnum(ApplicationType), default=ApplicationType.NEW_VERIFICATION, nullable=False)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED, nullable=False)
    
    proposed_date = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    instrument = relationship("Instrument", back_populates="applications")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    schedule = relationship("Schedule", uselist=False, back_populates="application")
    assignment = relationship("Assignment", uselist=False, back_populates="application")
    verification_event = relationship("VerificationEvent", uselist=False, back_populates="application")
    certificate = relationship("Certificate", uselist=False, back_populates="application")

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="status_history")
    actor = relationship("User")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    time_window = Column(String(100), default="10:00 AM - 01:00 PM")
    location_address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="schedule")
    created_by = relationship("User")
    assignment = relationship("Assignment", uselist=False, back_populates="schedule")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), unique=True, nullable=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    assigned_to_type = Column(String(50), nullable=False)  # LMO or GATC
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="ASSIGNED")  # ASSIGNED, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime, default=utc_now)

    schedule = relationship("Schedule", back_populates="assignment")
    application = relationship("Application", back_populates="assignment")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    reference_code = Column(String(100), nullable=False)  # e.g., "LM-RULE-NAWI-2011"
    jurisdiction = Column(String(100), default="National / All States")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    versions = relationship("RuleVersion", back_populates="rule")

class RuleVersion(Base):
    __tablename__ = "rule_versions"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=False)
    version_number = Column(String(50), nullable=False)  # e.g., "v1.2.0-DEMO"
    effective_from = Column(DateTime, default=utc_now)
    effective_to = Column(DateTime, nullable=True)
    is_current = Column(Boolean, default=True)
    statutory_disclaimer = Column(
        Text,
        default="DEMO CONFIGURATION — NOT A STATUTORY DETERMINATION. Prototype checklist for SIH26036 demonstration only."
    )
    created_at = Column(DateTime, default=utc_now)

    rule = relationship("Rule", back_populates="versions")
    checklists = relationship("Checklist", back_populates="rule_version")
    verification_events = relationship("VerificationEvent", back_populates="rule_version")

class Checklist(Base):
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True, index=True)
    rule_version_id = Column(Integer, ForeignKey("rule_versions.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("instrument_categories.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    rule_version = relationship("RuleVersion", back_populates="checklists")
    category = relationship("InstrumentCategory", back_populates="checklists")
    items = relationship("ChecklistItem", back_populates="checklist", order_by="ChecklistItem.order_index")

class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False)
    order_index = Column(Integer, default=0)
    code = Column(String(50), nullable=False)  # e.g. CHK_SEAL, CHK_ZERO, CHK_MAX_LOAD
    label = Column(String(255), nullable=False)
    field_type = Column(String(50), default="BOOLEAN")  # BOOLEAN, NUMBER, TEXT, SELECT
    unit = Column(String(50), nullable=True)  # kg, g, mm, etc.
    required = Column(Boolean, default=True)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)
    options_json = Column(Text, nullable=True)  # For SELECT fields
    help_text = Column(Text, nullable=True)

    checklist = relationship("Checklist", back_populates="items")
    observations = relationship("Observation", back_populates="checklist_item")

class VerificationEvent(Base):
    __tablename__ = "verification_events"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    verifier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verifier_role = Column(String(50), default="LMO")
    rule_version_id = Column(Integer, ForeignKey("rule_versions.id"), nullable=False)
    
    verification_date = Column(DateTime, default=utc_now)
    result = Column(SQLEnum(VerificationResult), nullable=False)
    verifier_remarks = Column(Text, nullable=True)
    geo_latitude = Column(Float, nullable=True)
    geo_longitude = Column(Float, nullable=True)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="verification_event")
    instrument = relationship("Instrument", back_populates="verification_events")
    verifier = relationship("User")
    rule_version = relationship("RuleVersion", back_populates="verification_events")
    observations = relationship("Observation", back_populates="verification_event", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="verification_event", cascade="all, delete-orphan")
    certificate = relationship("Certificate", uselist=False, back_populates="verification_event")

class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    verification_event_id = Column(Integer, ForeignKey("verification_events.id"), nullable=False)
    checklist_item_id = Column(Integer, ForeignKey("checklist_items.id"), nullable=False)
    item_label = Column(String(255), nullable=False)
    item_type = Column(String(50), default="BOOLEAN")
    value_entered = Column(String(255), nullable=False)
    unit = Column(String(50), nullable=True)
    is_compliant = Column(Boolean, default=True)
    remarks = Column(Text, nullable=True)

    verification_event = relationship("VerificationEvent", back_populates="observations")
    checklist_item = relationship("ChecklistItem", back_populates="observations")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    verification_event_id = Column(Integer, ForeignKey("verification_events.id"), nullable=True)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), default="PHOTO")  # PHOTO, SUPPORTING_DOC, CALIBRATION_CHART
    mime_type = Column(String(100), default="image/jpeg")
    file_size = Column(Integer, default=0)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    verification_event = relationship("VerificationEvent", back_populates="attachments")
    instrument = relationship("Instrument", back_populates="attachments")
    uploaded_by = relationship("User")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_number = Column(String(100), unique=True, index=True, nullable=False)  # LM-CERT-2026-000001
    qr_token = Column(String(100), unique=True, index=True, nullable=False)  # opaque signed token
    
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    verification_event_id = Column(Integer, ForeignKey("verification_events.id"), unique=True, nullable=False)
    
    issued_to_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    issued_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    issuing_authority_name = Column(String(255), default="Legal Metrology Department (Demo Authority)")
    
    issue_date = Column(DateTime, default=utc_now)
    valid_until_date = Column(DateTime, nullable=False)  # Configured demo validity period
    status = Column(SQLEnum(CertificateStatus), default=CertificateStatus.VALID, nullable=False)
    
    pdf_path = Column(String(500), nullable=True)
    revocation_reason = Column(Text, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    instrument = relationship("Instrument", back_populates="certificates")
    application = relationship("Application", back_populates="certificate")
    verification_event = relationship("VerificationEvent", back_populates="certificate")
    issued_to = relationship("User", foreign_keys=[issued_to_owner_id])
    issued_by = relationship("User", foreign_keys=[issued_by_user_id])
    revoked_by = relationship("User", foreign_keys=[revoked_by_id])
    events = relationship("CertificateEvent", back_populates="certificate", cascade="all, delete-orphan")

class CertificateEvent(Base):
    __tablename__ = "certificate_events"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(Integer, ForeignKey("certificates.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # GENERATED, PDF_DOWNLOADED, QR_VERIFIED, REVOKED, EXPIRED
    actor_info = Column(String(255), nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    certificate = relationship("Certificate", back_populates="events")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")  # INFO, WARNING, SUCCESS, ALERT
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="notifications")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, REGISTER, SUBMIT_APP, SCHEDULE, ASSIGN, VERIFY, ISSUE_CERT, REVOKE_CERT, etc.
    entity_type = Column(String(50), nullable=True)  # APPLICATION, INSTRUMENT, CERTIFICATE, SCHEDULE
    entity_id = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
