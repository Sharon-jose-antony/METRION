import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Application } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { FileCheck2, Filter, ArrowRight } from 'lucide-react';

export const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadApplications = () => {
    setLoading(true);
    api.applications.list({ status_filter: selectedStatus || undefined })
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApplications();
  }, [selectedStatus]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-md border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Verification Application Review Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scrutinize incoming verification requests, schedule inspection windows, and allocate authorized officers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:border-[#0B2545] focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted (Pending Review)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ACCEPTED">Accepted (Needs Scheduling)</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_FIELD_VERIFICATION">In Field Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="CERTIFICATE_ISSUED">Certificate Issued</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No applications match the selected filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Application ID</th>
                  <th className="px-4 py-3">Owner / Establishment</th>
                  <th className="px-4 py-3">Instrument ID & Make</th>
                  <th className="px-4 py-3">Application Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{app.application_number}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{app.owner_name}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-[#0B2545] block">{app.instrument_permanent_id}</span>
                      <span className="text-slate-600 text-[11px]">{app.instrument_name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{app.application_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 font-mono text-slate-500">{new Date(app.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/applications/${app.id}`}
                        className="px-2.5 py-1 bg-[#0B2545] hover:bg-[#133E68] text-white rounded text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        Review & Schedule <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
