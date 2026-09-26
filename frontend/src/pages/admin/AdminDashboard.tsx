import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminDashboardData } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Cpu,
  FileCheck2,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Users,
  AlertCircle,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  CheckSquare
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    api.dashboard.getAdmin()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, action_queue, recent_verifications } = data;

  const stages = [
    { key: 'ALL', label: 'ALL STAGES' },
    { key: 'SUBMITTED', label: 'PENDING REVIEW' },
    { key: 'SCHEDULED', label: 'SCHEDULED' },
    { key: 'ASSIGNED', label: 'ASSIGNED' },
    { key: 'IN_FIELD_VERIFICATION', label: 'IN FIELD' },
    { key: 'RESULT_SUBMITTED', label: 'RESULT SUBMITTED' },
    { key: 'VERIFIED', label: 'COMPLETED' },
  ];

  const filteredQueue = stageFilter === 'ALL'
    ? action_queue
    : action_queue.filter(item => {
        if (stageFilter === 'SUBMITTED') return item.severity === 'HIGH' || item.severity === 'URGENT';
        return true;
      });

  return (
    <div className="space-y-5 font-sans text-slate-800">
      
      {/* Control Room Header */}
      <div className="bg-white rounded border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
              OPERATIONS CONTROL
            </span>
            <span className="text-[10px] font-mono text-slate-400">SIH26036 Platform</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
            Verification Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational review queue, officer scheduling, secondary standards verification, and certificate governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/applications"
            className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            Review Queue ({metrics.pending_applications}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/admin/audit"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
          >
            Audit Log
          </Link>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <Link to="/admin/instruments" className="bg-white p-3 rounded border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Instruments
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-slate-900">{metrics.total_instruments}</span>
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </Link>

        <Link to="/admin/applications" className="bg-white p-3 rounded border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Awaiting Review
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-amber-700">{metrics.pending_applications}</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </Link>

        <Link to="/admin/applications" className="bg-white p-3 rounded border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            In Field
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-blue-700">
              {metrics.in_field_verifications + metrics.scheduled_verifications}
            </span>
            <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </Link>

        <Link to="/admin/certificates" className="bg-white p-3 rounded border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Certs
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-emerald-700">{metrics.verified_instruments}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </Link>

        <Link to="/admin/certificates" className="bg-white p-3 rounded border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Due Soon (30d)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-amber-700">{metrics.expiring_soon}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </Link>

        <Link to="/admin/rules" className="bg-white p-3 rounded border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Rule
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-xs font-bold text-purple-800">v2026.1-DEMO</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
          </div>
        </Link>
      </div>

      {/* Control Room Queue Filter Strip */}
      <div className="bg-white rounded border border-slate-200 p-2 shadow-2xs overflow-x-auto flex items-center gap-1.5 text-xs">
        {stages.map((stage) => (
          <button
            key={stage.key}
            onClick={() => setStageFilter(stage.key)}
            className={`px-3 py-1.5 rounded font-medium text-xs whitespace-nowrap transition-colors cursor-pointer ${
              stageFilter === stage.key
                ? 'bg-[#0f172a] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Primary Workflow Queue Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Application Processing Queue
            </h2>
            <p className="text-[11px] text-slate-500">
              Applications requiring review, scheduling, or field assignment
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
            {filteredQueue.length} Active Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Application</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Verification Type</th>
                <th className="py-2.5 px-3">Current Stage</th>
                <th className="py-2.5 px-3">Assigned Officer</th>
                <th className="py-2.5 px-3">Scheduled Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-xs text-slate-400 italic">
                    Queue clear. No pending applications matching the selected stage filter.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                      {item.badge || `APP-${item.id}`}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {item.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-[140px] truncate">
                      {item.subtitle || 'Commercial Applicant'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      Verification Dossier
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        item.severity === 'URGENT' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        item.severity === 'HIGH' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {item.severity === 'URGENT' ? 'UNDER REVIEW' : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      Officer Unassigned
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      Pending Schedule
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        to={item.action_link || `/admin/applications/${item.id}`}
                        className="px-2.5 py-1 bg-[#0f172a] hover:bg-slate-800 text-white font-medium text-[11px] rounded transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        {item.action_label || 'Scrutinize'} <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Field Determinations */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recent Field Determinations
            </h2>
            <p className="text-[11px] text-slate-500">
              Completed field verifications and issued Form VII certificates
            </p>
          </div>
          <Link
            to="/admin/certificates"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            All Certificates <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Certificate ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Verifying Officer</th>
                <th className="py-2.5 px-3">Determination Date</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {recent_verifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-400 italic">
                    No field verifications completed yet.
                  </td>
                </tr>
              ) : (
                recent_verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {v.certificate_number || 'VER-' + v.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      <span className="font-mono text-blue-900 font-bold block">{v.instrument_id}</span>
                      <span className="text-[11px] text-slate-500 font-sans">{v.category}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {v.verifier}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {new Date(v.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {v.result}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {v.certificate_number ? (
                        <Link
                          to="/admin/certificates"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] transition-colors inline-block border border-slate-200"
                        >
                          Certificate
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
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
