import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { OwnerDashboardData, Certificate, Instrument } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Plus,
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Cpu,
  RefreshCw,
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadDashboard = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.dashboard.getOwner().catch((e) => {
        console.warn('Dashboard getOwner API fallback:', e);
        return null;
      }),
      api.certificates.list().catch(() => []),
      api.instruments.list().catch(() => [])
    ])
      .then(([dashData, certList, instList]) => {
        const certs = certList || [];
        const insts = instList || [];
        if (dashData) {
          setData(dashData);
        } else {
          // Graceful fallback to avoid infinite spinner if summary endpoint lagged
          setData({
            metrics: {
              instruments: insts.length,
              pending_applications: 0,
              valid_certificates: certs.filter(c => c.status === 'VALID').length,
              expiring_soon: 0,
            },
            instruments_count: insts.length,
            pending_applications_count: 0,
            valid_certificates_count: certs.filter(c => c.status === 'VALID').length,
            expiring_soon_count: 0,
            recent_instruments: insts.slice(0, 5).map(i => ({
              id: i.id,
              instrument_id: i.instrument_id,
              category: i.category_name || 'Standard',
              name: `${i.manufacturer} ${i.model}`,
              serial_number: i.serial_number,
              status: i.current_status,
              valid_until: undefined,
              certificate_id: i.active_certificate_id,
            })),
            active_applications: [],
            expiring_certificates: [],
          });
        }
        setCertificates(certs);
        setInstruments(insts);
      })
      .catch((err: any) => {
        console.error('Dashboard load error:', err);
        setError(err.message || 'Unable to connect to backend');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading instrument dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Connection Timeout</h3>
        <p className="text-xs text-slate-500 max-w-sm">{error || 'Server connection took too long. Render may be waking up.'}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, active_applications, expiring_certificates } = data;

  return (
    <div className="space-y-5 font-sans text-slate-800">
      
      {/* Page Header */}
      <div className="bg-white rounded border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of verification activity and instrument lifecycle status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/owner/instruments/new"
            className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Register Instrument
          </Link>
          <Link
            to="/owner/applications/new"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> Apply For Verification
          </Link>
        </div>
      </div>

      {/* Compact KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Registered Instruments
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-slate-900">
              {String(metrics.instruments).padStart(2, '0')}
            </span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Pending Applications
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-blue-700">
              {String(metrics.pending_applications).padStart(2, '0')}
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Certificates
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-emerald-700">
              {String(metrics.valid_certificates).padStart(2, '0')}
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Due For Re-Verification
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-amber-700">
              {String(metrics.expiring_soon).padStart(2, '0')}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Action Required Section (Compact alert cards) */}
      {(metrics.expiring_soon > 0 || metrics.pending_applications > 0) && (
        <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Action Required
          </h2>
          <div className="space-y-1.5 text-xs">
            {metrics.expiring_soon > 0 && (
              <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 text-amber-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>{metrics.expiring_soon}</strong> instrument{metrics.expiring_soon > 1 ? 's' : ''} approaching verification due date within 30 days.
                  </span>
                </div>
                <Link
                  to="/owner/applications/new?type=RE_VERIFICATION"
                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-medium transition-colors shrink-0"
                >
                  File Re-verification
                </Link>
              </div>
            )}

            {metrics.pending_applications > 0 && (
              <div className="p-2.5 rounded bg-blue-50/70 border border-blue-200 text-blue-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>{metrics.pending_applications}</strong> application{metrics.pending_applications > 1 ? 's' : ''} currently undergoing scrutiny or scheduling.
                  </span>
                </div>
                <Link
                  to="/owner/applications"
                  className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[11px] font-medium transition-colors shrink-0"
                >
                  View Docket
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: Verification Activity */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Verification Activity
            </h2>
            <p className="text-[11px] text-slate-500">
              Recent applications and workflow progress
            </p>
          </div>
          <Link
            to="/owner/applications"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            View All Applications <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Application ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Verification Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Scheduled Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {active_applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-400 italic">
                    No active verification applications. Click "Apply For Verification" to lodge an application.
                  </td>
                </tr>
              ) : (
                active_applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-900">
                      {app.application_number}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {app.instrument_name || 'Commercial Instrument'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {app.type === 'NEW_VERIFICATION' ? 'Initial Verification' : 'Re-verification'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {app.created_at || 'Pending'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/owner/applications/${app.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] transition-colors inline-block border border-slate-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Recent Certificates */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recent Certificates
            </h2>
            <p className="text-[11px] text-slate-500">
              Issued digital verification certificates
            </p>
          </div>
          <Link
            to="/owner/certificates"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            All Certificates ({certificates.length}) <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Certificate ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Issued Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-slate-400 italic">
                    No certificates issued yet. Issued certificates will appear once field verification is completed.
                  </td>
                </tr>
              ) : (
                certificates.slice(0, 5).map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {cert.certificate_number}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {cert.instrument_permanent_id || 'LM-INST'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={cert.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <Link
                        to={`/verify/${cert.qr_token}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] transition-colors inline-block border border-slate-200"
                      >
                        Verify QR
                      </Link>
                      <a
                        href={`/uploads/cert_${cert.certificate_number}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded text-[11px] transition-colors inline-block"
                      >
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
