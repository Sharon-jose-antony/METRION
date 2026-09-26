import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Application, ApplicationStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import {
  Calendar,
  UserCheck,
  ArrowLeft,
  Download,
  QrCode,
  Scale,
  MapPin,
  Clock,
  FileText,
  Check,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.applications.get(Number(id))
      .then(setApp)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !app) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const timelineEvents = app.status_history.map(h => ({
    event_type: 'STATUS_CHANGE',
    title: `Status: ${h.to_status.replace(/_/g, ' ').toUpperCase()}`,
    timestamp: h.created_at,
    actor: h.actor_role,
    details: h.remarks
  }));

  // Workflow Stages Mapping
  const workflowStages = [
    { key: 'SUBMITTED', label: '1. Lodgement', desc: 'Application filed' },
    { key: 'SCRUTINY', label: '2. Scrutiny', desc: 'Document verification' },
    { key: 'SCHEDULED', label: '3. Scheduling', desc: 'Field slot selected' },
    { key: 'ASSIGNED', label: '4. Allocation', desc: 'LMO/GATC assigned' },
    { key: 'IN_FIELD_VERIFICATION', label: '5. Inspection', desc: 'MPE testing & sealing' },
    { key: 'CERTIFICATE_ISSUED', label: '6. Issuance', desc: 'Form VI stamped' },
  ];

  const getStageIndex = (status: ApplicationStatus) => {
    switch (status) {
      case 'DRAFT': return -1;
      case 'SUBMITTED': return 0;
      case 'UNDER_REVIEW':
      case 'NEEDS_CORRECTION': return 1;
      case 'ACCEPTED': return 1;
      case 'SCHEDULED': return 2;
      case 'ASSIGNED': return 3;
      case 'IN_FIELD_VERIFICATION':
      case 'RESULT_SUBMITTED': return 4;
      case 'VERIFIED':
      case 'CERTIFICATE_ISSUED': return 5;
      case 'REJECTED':
      case 'CANCELLED': return -2;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(app.status);
  const isRejected = app.status === 'REJECTED' || app.status === 'CANCELLED';

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-slate-800">
      
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/owner/applications"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Verification Applications
        </Link>
      </div>

      {/* Header Docket */}
      <div className="bg-white rounded border border-slate-300 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
                APPLICATION DOSSIER
              </span>
              <StatusBadge status={app.status} />
            </div>
            <h1 className="text-xl font-mono font-black text-[#0B2545] mt-1 tracking-tight">
              {app.application_number}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Type: <strong className="text-slate-900">{app.application_type === 'NEW_VERIFICATION' ? 'Initial Verification' : 'Periodic Re-verification'}</strong> • Lodged on:{' '}
              <span className="font-mono text-slate-700">{new Date(app.created_at).toLocaleDateString('en-IN')}</span>
            </p>
          </div>

          {app.certificate && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                to={`/verify/${app.certificate.qr_token}`}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" /> Verify Form VI
              </Link>
              <a
                href={api.certificates.getPdfUrl(app.certificate.id)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-[#0B2545] hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Certificate PDF
              </a>
            </div>
          )}
        </div>

        {/* Workflow State Progression Tracker */}
        <div className="pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Verification Lifecycle Progression:
          </span>

          {isRejected ? (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded flex items-center gap-2 text-rose-900 text-xs">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Determination: Application Rejected.</strong> The verification was denied by the scrutiny authority.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {workflowStages.map((stage, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                let stateClasses = 'bg-slate-50 border-slate-200 text-slate-400';
                let icon = <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center font-mono">{idx + 1}</span>;

                if (isPassed) {
                  stateClasses = 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold';
                  icon = <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />;
                } else if (isCurrent) {
                  stateClasses = 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-400';
                  icon = <span className="w-4 h-4 rounded-full bg-[#0B2545] text-white text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>;
                }

                return (
                  <div
                    key={stage.key}
                    className={`p-2 rounded border text-xs flex flex-col justify-between ${stateClasses}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold truncate">{stage.label}</span>
                      {icon}
                    </div>
                    <span className="text-[10px] opacity-75 leading-tight">{stage.desc}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Dossier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Column: Equipment Particulars */}
        <div className="bg-white rounded border border-slate-300 p-4 shadow-2xs space-y-3">
          <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#0B2545]" /> Subject Instrument Particulars
            </h2>
            <Link
              to={`/owner/instruments/${app.instrument_id}`}
              className="text-[11px] font-mono font-bold text-blue-700 hover:underline"
            >
              View Registry Profile →
            </Link>
          </div>

          <table className="w-full text-xs border border-slate-200">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="w-2/5 bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Permanent Instrument ID:
                </td>
                <td className="p-2 font-mono font-bold text-[#0B2545]">
                  {app.instrument_permanent_id}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Make & Model:
                </td>
                <td className="p-2 font-semibold text-slate-900">
                  {app.instrument_name}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Category:
                </td>
                <td className="p-2 text-slate-800">
                  {app.instrument_category}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Accuracy Class:
                </td>
                <td className="p-2 text-slate-800 font-medium">
                  Class III (Medium Accuracy)
                </td>
              </tr>
            </tbody>
          </table>

          {app.remarks && (
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Your Stated Remarks:</span>
              <p className="text-slate-800 italic text-[11px]">"{app.remarks}"</p>
            </div>
          )}

          {app.review_notes && (
            <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Verification Review Notes:</span>
              <p className="text-amber-950 font-medium text-[11px]">{app.review_notes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Scheduled Field Inspection & Verifier */}
        <div className="bg-white rounded border border-slate-300 p-4 shadow-2xs space-y-3">
          <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#0B2545]" /> Field Inspection & Verifier Assignment
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Roster Details</span>
          </div>

          {app.schedule ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/70 rounded border border-blue-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                  Assigned Inspection Window
                </span>
                <div className="text-sm font-bold text-blue-950">
                  {new Date(app.schedule.scheduled_date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Slot: {app.schedule.time_window}
                </div>
              </div>

              {app.assignment && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Designated Metrologist / Verifying Authority
                  </span>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    {app.assignment.assigned_to_name}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Category: <strong className="text-slate-800">{app.assignment.assigned_to_type === 'LMO' ? 'Legal Metrology Officer (Field Officer)' : 'Approved Test Centre Metrologist'}</strong>
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Physical Inspection Site:</span>
                <p className="text-slate-800 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  {app.schedule.location_address}
                </p>
              </div>

              <div className="p-2.5 bg-slate-100 rounded text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Operational Guidelines for Inspection Day:</span>
                <p>
                  Please ensure standard test weights, clear access to the instrument's nameplate, and sealing lugs are unobstructed during the inspection window.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300 space-y-1.5">
              <Clock className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">Awaiting Administrative Scrutiny & Roster Scheduling</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Once verification officers review your submitted application, an inspection date and assigned Legal Metrology Officer will appear here.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Lifecycle Status Transition History Table */}
      <div className="bg-white rounded border border-slate-300 p-5 shadow-2xs space-y-3">
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Lifecycle State Transition Audit Log
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            {timelineEvents.length} Recorded Milestone{timelineEvents.length === 1 ? '' : 's'}
          </span>
        </div>
        <Timeline events={timelineEvents} />
      </div>

    </div>
  );
};
