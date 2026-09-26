import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Application } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Plus, ArrowRight, FileCheck2 } from 'lucide-react';

export const ApplicationsList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.applications.list()
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Verification Applications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit and track applications for initial verification and periodic re-verification.
          </p>
        </div>

        <Link
          to="/owner/applications/new"
          className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> New Application
        </Link>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileCheck2 className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No applications on record</p>
            <p className="text-[11px] text-slate-400">Submit an application for your registered instruments.</p>
            <Link
              to="/owner/applications/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] text-white text-xs font-medium rounded mt-2"
            >
              <Plus className="w-3 h-3" /> Submit Application
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Application Number</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Permanent ID & Equipment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Submission Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                      {app.application_number}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {app.application_type === 'NEW_VERIFICATION' ? 'Initial Verification' : 'Re-verification'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-semibold text-slate-900 block">{app.instrument_permanent_id}</span>
                      <span className="text-slate-500 text-[11px]">{app.instrument_name}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(app.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/owner/applications/${app.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] rounded transition-colors inline-flex items-center gap-1 border border-slate-200"
                      >
                        Track Progress <ArrowRight className="w-3 h-3" />
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
