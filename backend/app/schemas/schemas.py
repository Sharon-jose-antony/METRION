from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from app.models.models import UserRole, OrgType, ApplicationType, ApplicationStatus, VerificationResult, CertificateStatus

# --- Authentication & User ---
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None

class UserRegister(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.INSTRUMENT_OWNER
    organization_name: Optional[str] = None
    state: Optional[str] = "Delhi"
    district: Optional[str] = "Central Delhi"
    designation: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    organization_id: Optional[int] = None
    designation: Optional[str] = None
    jurisdiction_state: Optional[str] = None
    jurisdiction_district: Optional[str] = None
    is_active: bool
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Organization ---
class OrganizationResponse(BaseModel):
    id: int
    name: str
    org_type: OrgType
    registration_number: Optional[str] = None
    address: Optional[str] = None
    state: str
    district: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True

# --- Instrument Category & Instrument ---
class InstrumentCategoryResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    default_validity_months: int
    is_active: bool

    class Config:
        from_attributes = True

class InstrumentCreate(BaseModel):
    category_id: int
    manufacturer: str
    model: str
    serial_number: str
    capacity: Optional[str] = None
    accuracy_class: Optional[str] = None
    year_of_manufacture: Optional[int] = None
    installation_address: str
    state: str = "Delhi"
    district: str = "Central Delhi"
    pincode: Optional[str] = None

class InstrumentUpdate(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    capacity: Optional[str] = None
    accuracy_class: Optional[str] = None
    installation_address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None

class InstrumentResponse(BaseModel):
    id: int
    instrument_id: str
    category_id: int
    category_name: Optional[str] = None
    category_code: Optional[str] = None
    owner_id: int
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    organization_id: Optional[int] = None
    organization_name: Optional[str] = None
    manufacturer: str
    model: str
    serial_number: str
    capacity: Optional[str] = None
    accuracy_class: Optional[str] = None
    year_of_manufacture: Optional[int] = None
    installation_address: str
    state: str
    district: str
    pincode: Optional[str] = None
    current_status: str
    active_certificate_id: Optional[int] = None
    active_certificate_number: Optional[str] = None
    valid_until_date: Optional[datetime] = None
    is_demo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Application ---
class ApplicationCreate(BaseModel):
    instrument_id: int
    application_type: ApplicationType = ApplicationType.NEW_VERIFICATION
    proposed_date: Optional[datetime] = None
    remarks: Optional[str] = None

class ApplicationReviewRequest(BaseModel):
    status: ApplicationStatus  # ACCEPTED, NEEDS_CORRECTION, REJECTED
    review_notes: Optional[str] = None

class ApplicationStatusHistoryResponse(BaseModel):
    id: int
    from_status: Optional[str] = None
    to_status: str
    actor_role: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    application_number: str
    instrument_id: int
    instrument_permanent_id: Optional[str] = None
    instrument_name: Optional[str] = None
    instrument_category: Optional[str] = None
    owner_id: int
    owner_name: Optional[str] = None
    application_type: ApplicationType
    status: ApplicationStatus
    proposed_date: Optional[datetime] = None
    remarks: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    status_history: List[ApplicationStatusHistoryResponse] = []
    schedule: Optional[Dict[str, Any]] = None
    assignment: Optional[Dict[str, Any]] = None
    certificate: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# --- Schedule & Assignment ---
class ScheduleCreate(BaseModel):
    application_id: int
    scheduled_date: datetime
    time_window: str = "10:00 AM - 01:00 PM"
    location_address: str
    notes: Optional[str] = None
    assign_to_type: str = "LMO"  # LMO or GATC
    assigned_to_user_id: int

class ScheduleResponse(BaseModel):
    id: int
    application_id: int
    scheduled_date: datetime
    time_window: str
    location_address: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AssignmentResponse(BaseModel):
    id: int
    application_id: int
    schedule_id: Optional[int] = None
    assigned_to_type: str
    assigned_to_user_id: int
    assigned_to_name: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Rule & Checklist ---
class ChecklistItemResponse(BaseModel):
    id: int
    checklist_id: int
    order_index: int
    code: str
    label: str
    field_type: str
    unit: Optional[str] = None
    required: bool
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    options_json: Optional[str] = None
    help_text: Optional[str] = None

    class Config:
        from_attributes = True

class ChecklistResponse(BaseModel):
    id: int
    rule_version_id: int
    category_id: int
    name: str
    description: Optional[str] = None
    items: List[ChecklistItemResponse] = []

    class Config:
        from_attributes = True

class RuleVersionResponse(BaseModel):
    id: int
    rule_id: int
    version_number: str
    effective_from: datetime
    is_current: bool
    statutory_disclaimer: str
    checklists: List[ChecklistResponse] = []

    class Config:
        from_attributes = True

# --- Verification & Observation ---
class ObservationInput(BaseModel):
    checklist_item_id: int
    value_entered: str
    unit: Optional[str] = None
    is_compliant: bool = True
    remarks: Optional[str] = None

class VerificationSubmitRequest(BaseModel):
    application_id: int
    rule_version_id: int
    result: VerificationResult  # VERIFIED, REJECTED, NEEDS_REVIEW
    verifier_remarks: str
    observations: List[ObservationInput]
    geo_latitude: Optional[float] = None
    geo_longitude: Optional[float] = None

class ObservationResponse(BaseModel):
    id: int
    checklist_item_id: int
    item_label: str
    item_type: str
    value_entered: str
    unit: Optional[str] = None
    is_compliant: bool
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    file_type: str
    mime_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

class VerificationResponse(BaseModel):
    id: int
    application_id: int
    instrument_id: int
    verifier_id: int
    verifier_name: Optional[str] = None
    verifier_role: str
    rule_version_id: int
    verification_date: datetime
    result: VerificationResult
    verifier_remarks: Optional[str] = None
    observations: List[ObservationResponse] = []
    attachments: List[AttachmentResponse] = []
    certificate_id: Optional[int] = None
    certificate_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Certificate ---
class CertificateResponse(BaseModel):
    id: int
    certificate_number: str
    qr_token: str
    instrument_id: int
    instrument_permanent_id: Optional[str] = None
    category_name: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    owner_name: Optional[str] = None
    application_id: int
    verification_event_id: int
    issuing_authority_name: str
    verifier_name: Optional[str] = None
    issue_date: datetime
    valid_until_date: datetime
    status: CertificateStatus
    pdf_url: Optional[str] = None
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CertificatePublicVerifyResponse(BaseModel):
    authenticity_status: str  # VALID, EXPIRED, REVOKED, INVALID
    is_authentic: bool
    certificate_number: str
    instrument_id: str
    instrument_category: str
    manufacturer: str
    model: str
    serial_number_masked: str
    verification_date: datetime
    valid_until_date: datetime
    status: CertificateStatus
    issuing_authority: str
    verifier_role: str
    verifier_name: str
    verification_timestamp: datetime
    disclaimer: str

class CertificateRevokeRequest(BaseModel):
    revocation_reason: str = Field(..., min_length=5)

# --- Notification & Audit ---
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditEventResponse(BaseModel):
    id: int
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    description: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboards ---
class MetricCard(BaseModel):
    title: str
    value: int
    change: Optional[str] = None
    color: str
    icon: str
    link: Optional[str] = None

class ActionItem(BaseModel):
    id: int
    title: str
    subtitle: str
    severity: str  # URGENT, HIGH, MEDIUM, LOW
    action_label: str
    action_link: str
    badge: str

class AdminDashboardResponse(BaseModel):
    metrics: Dict[str, int]
    action_queue: List[ActionItem]
    status_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    recent_verifications: List[Dict[str, Any]]
    workload_distribution: List[Dict[str, Any]]

class OwnerDashboardResponse(BaseModel):
    metrics: Dict[str, int]
    instruments_count: int
    pending_applications_count: int
    valid_certificates_count: int
    expiring_soon_count: int
    recent_instruments: List[Dict[str, Any]]
    active_applications: List[Dict[str, Any]]
    expiring_certificates: List[Dict[str, Any]]

class VerifierDashboardResponse(BaseModel):
    metrics: Dict[str, int]
    today_assignments: List[Dict[str, Any]]
    upcoming_assignments: List[Dict[str, Any]]
    completed_recent: List[Dict[str, Any]]
