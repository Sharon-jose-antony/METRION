import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { VerifierDashboardData } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  Scale,
  ClipboardCheck,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export const LmoDashboard: React.FC = () => {
  const [data, setData] = useState<VerifierDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    setError(null);
    api.dashboard.getVerifier()
      .then(setData)
      .catch((err) => {
        console.warn('Verifier dashboard load warning:', err);
        setError('Could not fetch latest roster from server.');
        // Fallback to empty shell so user is not blocked
        setData({
          metrics: { today_cases: 0, upcoming_cases: 0, completed_total: 0 },
          today_assignments: [],
          upcoming_assignments: [],
          completed_recent: []
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Connecting to verification station...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center space-y-3 my-8">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-semibold text-red-700">Unable to connect to verification services</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans text-slate-800">
      
      {/* Officer Station Header */}
      <div className="bg-white rounded border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              FIELD VERIFICATION OFFICER
            </span>
            <span className="text-[10px] font-mono text-slate-400">SIH26036 Platform</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
            Field Inspection Roster & Stamping Station
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            On-site physical testing, checklist execution, working standards tolerance verification, and certificate generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/lmo/assignments"
            className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <CalendarDays className="w-3.5 h-3.5" /> Full Inspection Schedule
          </Link>
        </div>
      </div>

      {/* Compact Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Scheduled Today
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-amber-700">
              {String(data.metrics.today_cases).padStart(2, '0')}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Upcoming Pipeline
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-blue-700">
              {String(data.metrics.upcoming_cases).padStart(2, '0')}
            </span>
            <CalendarDays className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Determinations Filed
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-emerald-700">
              {String(data.metrics.completed_total).padStart(2, '0')}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Primary Table: Today's Scheduled Field Roster */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Today's Field Inspection Schedule
            </h2>
            <p className="text-[11px] text-slate-500">
              Active assigned cases ready for field inspection and Form VII certification
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
            {data.today_assignments.length} Cases Today
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Time Window</th>
                <th className="py-2.5 px-3">Permanent ID</th>
                <th className="py-2.5 px-3">Instrument Model</th>
                <th className="py-2.5 px-3">Applicant / Premise</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Field Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {data.today_assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-400 italic">
                    No field inspections scheduled for today. Consult upcoming schedule for future assignments.
                  </td>
                </tr>
              ) : (
                data.today_assignments.map((item) => (
                  <tr key={item.assignment_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                      {item.time_window || '10:00 - 12:00'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                      {item.instrument_id || 'LM-INST'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.instrument_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {item.owner_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate">
                      {item.location}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/lmo/verification/${item.application_id}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] rounded transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Scale className="w-3 h-3" /> Conduct Inspection
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Assigned Cases Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Upcoming Allocated Inspection Pipeline
            </h2>
            <p className="text-[11px] text-slate-500">
              Assigned duties scheduled over upcoming days
            </p>
          </div>
          <Link
            to="/lmo/assignments"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            Full Roster <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Scheduled Date</th>
                <th className="py-2.5 px-3">Permanent ID</th>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Premise Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {data.upcoming_assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-400 italic">
                    No upcoming assignments in pipeline.
                  </td>
                </tr>
              ) : (
                data.upcoming_assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                      {new Date(item.scheduled_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-900">
                      {item.instrument_permanent_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.instrument_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[180px] truncate">
                      {item.location_address}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/lmo/verification/${item.application_id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] rounded transition-colors inline-block border border-slate-200"
                      >
                        Prepare Dossier
                      </Link>
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
