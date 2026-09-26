import {
  User,
  Instrument,
  InstrumentCategory,
  Application,
  ChecklistData,
  ObservationInput,
  Certificate,
  PublicCertificateVerify,
  AdminDashboardData,
  OwnerDashboardData,
  VerifierDashboardData,
  NotificationItem,
  AuditEventItem,
  UserRole
} from '../types';

export const RENDER_BACKEND_URL = 'https://metrion.onrender.com';

export const getApiBase = (): string => {
  // 1. Runtime override from localStorage (e.g. if user wants to switch backend)
  const saved = typeof window !== 'undefined' ? localStorage.getItem('metrion_api_url') : null;
  if (saved) {
    return `${saved.replace(/\/+$/, '')}/api`;
  }
  // 2. Vite environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/+$/, '')}/api`;
  }
  // 3. In production or hosted on github.io or anywhere non-localhost
  if (
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('github.io') ||
        !['localhost', '127.0.0.1'].includes(window.location.hostname)))
  ) {
    return `${RENDER_BACKEND_URL}/api`;
  }
  // 4. Local development proxy fallback
  return '/api';
};

export const getBackendBaseUrl = (): string => {
  const base = getApiBase();
  return base.endsWith('/api') ? base.slice(0, -4) : base;
};

export const getCertificatePdfUrl = (certId: number | string): string => {
  return `${getApiBase()}/certificates/${certId}/pdf`;
};

export const getUploadUrl = (relativePath: string): string => {
  const clean = relativePath.replace(/^\/+/, '');
  return `${getBackendBaseUrl()}/${clean}`;
};

export const API_BASE = getApiBase();

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('metrion_token') || localStorage.getItem('legalmet_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const base = getApiBase();
  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('metrion_token');
    localStorage.removeItem('metrion_user');
    localStorage.removeItem('legalmet_token');
    localStorage.removeItem('legalmet_user');
    const isVerify = window.location.hash.includes('/verify') || window.location.pathname.includes('/verify');
    const isLogin = window.location.hash.includes('/login') || window.location.pathname.endsWith('/login');
    if (!isVerify && !isLogin) {
      if (window.location.hash) {
        window.location.hash = '#/login';
      } else {
        window.location.href = '#/login';
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errData;
    try {
      errData = await response.json();
      errorMessage = errData.detail || errData.message || errorMessage;
    } catch {
      // not json
    }
    throw new ApiError(response.status, errorMessage, errData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ access_token: string; refresh_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) =>
      request<{ access_token: string; refresh_token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () => request<User>('/auth/me'),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  },

  // Users
  users: {
    list: (role?: UserRole) =>
      request<User[]>(role ? `/users?role=${role}` : '/users'),
    get: (id: number) => request<User>(`/users/${id}`),
  },

  // Instruments
  instruments: {
    list: (params?: { category_id?: number; status_filter?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.category_id) searchParams.set('category_id', String(params.category_id));
      if (params?.status_filter) searchParams.set('status_filter', params.status_filter);
      if (params?.search) searchParams.set('search', params.search);
      const q = searchParams.toString();
      return request<Instrument[]>(`/instruments${q ? `?${q}` : ''}`);
    },
    getCategories: () => request<InstrumentCategory[]>('/instruments/categories'),
    get: (id: number) => request<Instrument>(`/instruments/${id}`),
    create: (data: any) =>
      request<Instrument>('/instruments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getHistory: (id: number) => request<{ instrument_id: string; model: string; serial_number: string; current_status: string; timeline: any[] }>(`/instruments/${id}/history`),
  },

  // Applications
  applications: {
    list: (params?: { status_filter?: string; instrument_id?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.status_filter) searchParams.set('status_filter', params.status_filter);
      if (params?.instrument_id) searchParams.set('instrument_id', String(params.instrument_id));
      const q = searchParams.toString();
      return request<Application[]>(`/applications${q ? `?${q}` : ''}`);
    },
    get: (id: number) => request<Application>(`/applications/${id}`),
    create: (data: { instrument_id: number; application_type?: string; proposed_date?: string; remarks?: string }) =>
      request<Application>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    review: (id: number, data: { status: string; review_notes?: string }) =>
      request<Application>(`/applications/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Schedules & Assignments
  schedules: {
    create: (data: {
      application_id: number;
      scheduled_date: string;
      time_window: string;
      location_address: string;
      notes?: string;
      assign_to_type: string;
      assigned_to_user_id: number;
    }) =>
      request<any>('/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () => request<any[]>('/schedules'),
  },

  assignments: {
    list: () => request<any[]>('/assignments'),
  },

  // Verifications
  verifications: {
    getChecklist: (applicationId: number) =>
      request<ChecklistData>(`/verifications/checklist-for-app/${applicationId}`),
    uploadEvidence: (applicationId: number, file: File, fileType: string = 'PHOTO') => {
      const formData = new FormData();
      formData.append('application_id', String(applicationId));
      formData.append('file_type', fileType);
      formData.append('file', file);
      return request<any>('/verifications/upload-evidence', {
        method: 'POST',
        body: formData,
      });
    },
    submit: (data: {
      application_id: number;
      rule_version_id: number;
      result: 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW';
      verifier_remarks: string;
      observations: ObservationInput[];
      geo_latitude?: number;
      geo_longitude?: number;
    }) =>
      request<any>('/verifications/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: number) => request<any>(`/verifications/${id}`),
  },

  // Certificates
  certificates: {
    list: (statusFilter?: string) =>
      request<Certificate[]>(statusFilter ? `/certificates?status_filter=${statusFilter}` : '/certificates'),
    get: (id: number) => request<Certificate>(`/certificates/${id}`),
    getPdfUrl: (id: number | string) => getCertificatePdfUrl(id),
    revoke: (id: number, revocation_reason: string) =>
      request<Certificate>(`/certificates/${id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ revocation_reason }),
      }),
  },

  // Public QR verification
  public: {
    verifyCertificate: (token: string) =>
      request<PublicCertificateVerify>(`/public/certificates/verify/${token}`),
  },

  // Rules
  rules: {
    list: () => request<any[]>('/rules'),
    getCurrentVersion: () => request<any>('/rules/versions/current'),
  },

  // Dashboards
  dashboard: {
    getAdmin: () => request<AdminDashboardData>('/dashboard/admin'),
    getOwner: () => request<OwnerDashboardData>('/dashboard/owner'),
    getVerifier: () => request<VerifierDashboardData>('/dashboard/verifier'),
  },

  // Notifications
  notifications: {
    list: () => request<NotificationItem[]>('/notifications'),
    markRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
  },

  // Audit
  audit: {
    list: (action?: string) =>
      request<AuditEventItem[]>(action ? `/audit-events?action=${action}` : '/audit-events'),
  },

  // Helpers
  getApiBase,
  getBackendBaseUrl,
  getUploadUrl,
};
