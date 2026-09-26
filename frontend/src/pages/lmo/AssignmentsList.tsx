import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { CalendarDays, Clock, MapPin, ClipboardCheck, ArrowRight, UserCheck } from 'lucide-react';

export const AssignmentsList: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.assignments.list()
      .then(setAssignments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assigned Field Verification Cases</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Physical inspection assignments allocated to your jurisdictional zone and officer badge.
        </p>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No field cases assigned currently.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map(a => (
              <div key={a.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0B2545]">{a.instrument_id}</span>
                    <span className="font-mono text-slate-500">({a.application_number})</span>
                    <StatusBadge status={a.application_status} />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{a.instrument_name}</h3>
                  <p className="text-slate-500">{a.instrument_category} • S/N: <span className="font-mono font-bold text-slate-700">{a.serial_number}</span></p>

                  <div className="pt-1.5 flex flex-wrap items-center gap-4 text-slate-600 text-[11px]">
                    <span className="flex items-center gap-1 font-semibold text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('en-IN') : 'Scheduled'} ({a.time_window || 'Standard'})
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {a.location_address}
                    </span>
                    <span className="text-slate-500">
                      Owner: <strong>{a.owner_name}</strong> {a.owner_phone ? `(${a.owner_phone})` : ''}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => navigate(`/lmo/verification/${a.application_id}`)}
                    className="w-full md:w-auto px-4 py-2 bg-[#0B2545] hover:bg-[#133E68] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Open Field Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
