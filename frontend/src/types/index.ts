export type UserRole = 'ADMIN' | 'INSTRUMENT_OWNER' | 'LMO' | 'GATC';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  organization_name?: string;
  designation?: string;
  state?: string;
  district?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface InstrumentCategory {
  id: number;
  code: string;
  name: string;
  description?: string;
  default_validity_months: number;
  is_active: boolean;
}

export interface Instrument {
  id: number;
  instrument_id: string; // e.g. LM-INST-000001
  category_id: number;
  category_name?: string;
  category_code?: string;
  owner_id: number;
  owner_name?: string;
  owner_email?: string;
  organization_id?: number;
  organization_name?: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  capacity?: string;
  accuracy_class?: string;
  year_of_manufacture?: number;
  installation_address: string;
  state: string;
  district: string;
  pincode?: string;
  current_status: string;
  active_certificate_id?: number;
  active_certificate_number?: string;
  valid_until_date?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_CORRECTION'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'IN_FIELD_VERIFICATION'
  | 'RESULT_SUBMITTED'
  | 'VERIFIED'
  | 'CERTIFICATE_ISSUED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'RE_VERIFICATION_REQUIRED';

export type ApplicationType = 'NEW_VERIFICATION' | 'RE_VERIFICATION';

export interface StatusHistoryItem {
  id: number;
  from_status?: string;
  to_status: string;
  actor_role?: string;
  remarks?: string;
  created_at: string;
}

export interface Application {
  id: number;
  application_number: string;
  instrument_id: number;
  instrument_permanent_id?: string;
  instrument_name?: string;
  instrument_category?: string;
  owner_id: number;
  owner_name?: string;
  application_type: ApplicationType;
  status: ApplicationStatus;
  proposed_date?: string;
  remarks?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  status_history: StatusHistoryItem[];
  schedule?: {
    id: number;
    scheduled_date: string;
    time_window: string;
    location_address: string;
    notes?: string;
  };
  assignment?: {
    id: number;
    assigned_to_type: string;
    assigned_to_user_id: number;
    assigned_to_name?: string;
    status: string;
  };
  certificate?: {
    id: number;
    certificate_number: string;
    qr_token: string;
    status: string;
    issue_date: string;
    valid_until_date: string;
  };
}

export interface ChecklistItem {
  id: number;
  order_index: number;
  code: string;
  label: string;
  field_type: 'BOOLEAN' | 'NUMBER' | 'TEXT' | 'SELECT';
  unit?: string;
  required: boolean;
  min_value?: number;
  max_value?: number;
  options_json?: string;
  help_text?: string;
}

export interface ChecklistData {
  rule_version_id: number;
  rule_version_code: string;
  statutory_disclaimer: string;
  checklist_id: number;
  checklist_name: string;
  description?: string;
  items: ChecklistItem[];
}

export interface ObservationInput {
  checklist_item_id: number;
  value_entered: string;
  unit?: string;
  is_compliant: boolean;
  remarks?: string;
}

export interface VerificationResponse {
  id: number;
  application_id: number;
  instrument_id: number;
  verifier_id: number;
  verifier_name?: string;
  verifier_role: string;
  rule_version_id: number;
  verification_date: string;
  result: string;
  verifier_remarks?: string;
  observations: Array<{
    id: number;
    checklist_item_id: number;
    item_label: string;
    item_type: string;
    value_entered: string;
    unit?: string;
    is_compliant: boolean;
    remarks?: string;
  }>;
  attachments: Array<{
    id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    mime_type: string;
    file_size: number;
    created_at: string;
  }>;
  certificate_id?: number;
  certificate_number?: string;
  created_at: string;
}

export interface Certificate {
  id: number;
  certificate_number: string;
  qr_token: string;
  instrument_id: number;
  instrument_permanent_id?: string;
  category_name?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  owner_name?: string;
  application_id: number;
  verification_event_id: number;
  issuing_authority_name: string;
  verifier_name?: string;
  issue_date: string;
  valid_until_date: string;
  status: 'ISSUED' | 'VALID' | 'EXPIRED' | 'REVOKED';
  pdf_url?: string;
  is_demo: boolean;
  created_at: string;
}

export interface PublicCertificateVerify {
  authenticity_status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'INVALID';
  is_authentic: boolean;
  certificate_number: string;
  instrument_id: string;
  instrument_category: string;
  manufacturer: string;
  model: string;
  serial_number_masked: string;
  verification_date: string;
  valid_until_date: string;
  status: string;
  issuing_authority: string;
  verifier_role: string;
  verifier_name: string;
  verification_timestamp: string;
  disclaimer: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditEventItem {
  id: number;
  user_email?: string;
  user_role?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  created_at: string;
}

export interface AdminDashboardData {
  metrics: {
    total_instruments: number;
    pending_applications: number;
    scheduled_verifications: number;
    in_field_verifications: number;
    verified_instruments: number;
    expiring_soon: number;
    expired: number;
    total_certificates: number;
  };
  action_queue: Array<{
    id: number;
    title: string;
    subtitle: string;
    severity: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    action_label: string;
    action_link: string;
    badge: string;
  }>;
  status_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  recent_verifications: Array<{
    id: number;
    instrument_id: string;
    category: string;
    verifier: string;
    result: string;
    date: string;
    certificate_number?: string;
  }>;
  workload_distribution: Array<{
    name: string;
    role: string;
    active_cases: number;
    completed_cases: number;
    district: string;
  }>;
}

export interface OwnerDashboardData {
  metrics: {
    instruments: number;
    pending_applications: number;
    valid_certificates: number;
    expiring_soon: number;
  };
  instruments_count: number;
  pending_applications_count: number;
  valid_certificates_count: number;
  expiring_soon_count: number;
  recent_instruments: Array<{
    id: number;
    instrument_id: string;
    category: string;
    name: string;
    serial_number: string;
    status: string;
    valid_until?: string;
    certificate_id?: number;
  }>;
  active_applications: Array<{
    id: number;
    application_number: string;
    type: string;
    instrument_name?: string;
    status: string;
    created_at: string;
  }>;
  expiring_certificates: Array<{
    id: number;
    certificate_number: string;
    instrument_id?: number;
    instrument_permanent_id?: string;
    instrument_name?: string;
    valid_until?: string;
    can_reverify: boolean;
  }>;
}

export interface VerifierDashboardData {
  metrics: {
    today_cases: number;
    upcoming_cases: number;
    completed_total: number;
  };
  today_assignments: Array<{
    assignment_id: number;
    application_id: number;
    application_number: string;
    instrument_id?: string;
    instrument_name?: string;
    instrument_category?: string;
    owner_name?: string;
    owner_phone?: string;
    location?: string;
    scheduled_date?: string;
    time_window?: string;
    status: string;
  }>;
  upcoming_assignments: Array<any>;
  completed_recent: Array<{
    id: number;
    application_id: number;
    instrument_id?: string;
    instrument_name?: string;
    result: string;
    date: string;
    certificate_number?: string;
  }>;
}
