import React from 'react';
import {
  CheckCircle2,
  Clock,
  FileCheck2,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';

export interface TimelineEvent {
  event_type: string;
  title: string;
  timestamp: string;
  actor?: string;
  details?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-xs text-slate-500 py-6 text-center italic bg-slate-50 rounded border border-slate-200">
        No lifecycle events recorded yet for this instrument.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('CERTIFICATE') || t.includes('ISSUED')) {
      return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (t.includes('VERIFIED') || t.includes('COMPLETED') || t.includes('PASSED')) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (t.includes('ASSIGNED') || t.includes('SCHEDULED') || t.includes('OFFICER')) {
      return <UserCheck className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (t.includes('APPLICATION') || t.includes('SUBMITTED')) {
      return <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (t.includes('ACCEPTED') || t.includes('REVIEW')) {
      return <Clock className="w-3.5 h-3.5 text-amber-600" />;
    }
    if (t.includes('REJECTED') || t.includes('FAILED') || t.includes('REVOKED')) {
      return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-500" />;
  };

  const getEventBadgeColor = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('CERTIFICATE') || t.includes('PASSED') || t.includes('VERIFIED')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (t.includes('ASSIGNED') || t.includes('APPLICATION')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (t.includes('REVIEW') || t.includes('ACCEPTED') || t.includes('SCHEDULED')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (t.includes('REJECTED') || t.includes('REVOKED')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
      {events.map((evt, idx) => {
        const isLatest = idx === events.length - 1;
        return (
          <div key={idx} className="relative group">
            {/* Timeline node */}
            <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-xs transition-colors ${
              isLatest ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-300'
            }`}>
              {getEventIcon(evt.event_type || evt.title)}
            </div>

            {/* Event Content Card */}
            <div className="bg-white rounded border border-slate-200 p-3.5 hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">
                    {evt.title}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border ${getEventBadgeColor(evt.event_type)}`}>
                    {evt.event_type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>
                    {new Date(evt.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                {evt.details ? (
                  <p className="text-slate-700 text-xs font-sans">
                    {evt.details}
                  </p>
                ) : (
                  <span className="text-slate-400 text-xs italic">System event record</span>
                )}

                {evt.actor && (
                  <div className="shrink-0 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Actor: <span className="font-medium text-slate-700">{evt.actor}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
