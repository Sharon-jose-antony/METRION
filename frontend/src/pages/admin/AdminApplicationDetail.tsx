import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Application, User, ApplicationStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import {
  FileCheck2,
  Calendar,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  CalendarDays,
  Scale,
  Download,
  QrCode,
  FileText,
  BadgeAlert,
  Send,
  Building,
  Check,
  ArrowRight
} from 'lucide-react';

export const AdminApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [verifiers, setVerifiers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Form
  const [reviewStatus, setReviewStatus] = useState<'ACCEPTED' | 'REJECTED' | 'NEEDS_CORRECTION'>('ACCEPTED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Scheduling Form
  const [schedDate, setSchedDate] = useState('');
  const [timeWindow, setTimeWindow] = useState('10:00 AM - 01:00 PM');
  const [selectedVerifierId, setSelectedVerifierId] = useState<number | ''>('');
  const [assignType, setAssignType] = useState<'LMO' | 'GATC'>('LMO');
  const [schedNotes, setSchedNotes] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  const loadData = () => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.applications.get(Number(id)),
      api.users.list()
    ])
      .then(([app, users]) => {
        setApplication(app);
        const eligible = users.filter(u => u.role === 'LMO' || u.role === 'GATC');
        setVerifiers(eligible);
        if (eligible.length > 0) setSelectedVerifierId(eligible[0].id);

        // Pre-fill date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSchedDate(tomorrow.toISOString().split('T')[0]);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;
    setSubmittingReview(true);
    setError(null);

    try {
      await api.applications.review(application.id, {
        status: reviewStatus,
        review_notes: reviewNotes.trim() || undefined
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Review submission failed.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !selectedVerifierId || !schedDate) {
      setError('Please choose date and assigned verifier.');
      return;
    }

    setSubmittingSchedule(true);
    setError(null);

    try {
      await api.schedules.create({
        application_id: application.id,
        scheduled_date: new Date(schedDate).toISOString(),
        time_window: timeWindow,
        location_address: application.schedule?.location_address || 'Registered Establishment Location',
        notes: schedNotes.trim() || undefined,
        assign_to_type: assignType,
        assigned_to_user_id: Number(selectedVerifierId)
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Scheduling failed.');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  if (loading || !application) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const timelineEvents = application.status_history.map(h => ({
    event_type: 'STATUS_CHANGE',
    title: `Status: ${h.to_status.replace(/_/g, ' ').toUpperCase()}`,
    timestamp: h.created_at,
    actor: h.actor_role,
    details: h.remarks
  }));

  const canReview = ['SUBMITTED', 'UNDER_REVIEW'].includes(application.status);
  const canSchedule = ['ACCEPTED', 'SUBMITTED', 'SCHEDULED'].includes(application.status);

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

  const currentStageIndex = getStageIndex(application.status);
  const isRejected = application.status === 'REJECTED' || application.status === 'CANCELLED';

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-slate-800">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/applications"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Scrutiny Queue
        </Link>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
          Verification Dossier Ref: METRION-DOSSIER-{application.id}
        </span>
      </div>

      {/* Case Dossier Masthead */}
      <div className="bg-white rounded border border-slate-300 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
                APPLICATION DOSSIER
              </span>
              <StatusBadge status={application.status} />
            </div>
            <h1 className="text-xl font-mono font-black text-[#0B2545] mt-1 tracking-tight">
              {application.application_number}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Applicant: <strong className="text-slate-900">{application.owner_name}</strong> • Type:{' '}
              <span className="font-semibold text-slate-800">
                {application.application_type === 'NEW_VERIFICATION' ? 'Initial Verification' : 'Periodic Re-verification'}
              </span> • Lodged:{' '}
              <span className="font-mono text-slate-700">{new Date(application.created_at).toLocaleString('en-IN')}</span>
            </p>
          </div>

          {application.certificate && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                to={`/verify/${application.certificate.qr_token}`}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded inline-flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" /> Verify Form VI
              </Link>
              <a
                href={`/uploads/cert_${application.certificate.certificate_number}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-[#0B2545] hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-2xs inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Certificate PDF
              </a>
            </div>
          )}
        </div>

        {/* WORKFLOW PROGRESSION STEPPER */}
        <div className="pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Verification Workflow Progression State:
          </span>

          {isRejected ? (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded flex items-center gap-2 text-rose-900 text-xs">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Determination: Application Rejected / Revoked.</strong> Verification process has been discontinued.
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

      {error && (
        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Column Operational Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Column: Equipment Particulars */}
        <div className="bg-white rounded border border-slate-300 p-4 shadow-2xs space-y-4">
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#0B2545]" /> Subject Instrument Specifications
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Registry Profile</span>
          </div>

          <table className="w-full text-xs border border-slate-200">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="w-2/5 bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Permanent Instrument ID:
                </td>
                <td className="p-2 font-mono font-bold text-[#0B2545]">
                  {application.instrument_permanent_id}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Make & Model:
                </td>
                <td className="p-2 font-semibold text-slate-900">
                  {application.instrument_name}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Category:
                </td>
                <td className="p-2 text-slate-800">
                  {application.instrument_category}
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
              <tr>
                <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Max Capacity / Range:
                </td>
                <td className="p-2 font-mono font-bold text-slate-800">
                  50 kg (Standard Dual Interval)
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                  Inspection Premises:
                </td>
                <td className="p-2 text-slate-800 text-[11px]">
                  {application.schedule?.location_address || 'Registered Commercial Premises, Central Delhi'}
                </td>
              </tr>
            </tbody>
          </table>

          {application.remarks && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Applicant Site Remarks:
              </span>
              <p className="text-slate-800 italic leading-relaxed text-[11px]">
                "{application.remarks}"
              </p>
            </div>
          )}

          {application.review_notes && (
            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Official Scrutiny Remarks on Record:
              </span>
              <p className="text-amber-950 font-medium leading-relaxed text-[11px]">
                {application.review_notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Administrative Actions & Allocation Docket */}
        <div className="space-y-4">
          
          {/* Action Step 1: Verification Scrutiny Form */}
          {canReview && (
            <div className="bg-white rounded border-2 border-amber-300 p-4 shadow-2xs space-y-3">
              <div className="border-b border-amber-200 pb-2 flex items-center justify-between">
                <h3 className="font-bold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-amber-700" />
                  Administrative Scrutiny Determination
                </h3>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  Action Required
                </span>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scrutiny Determination *</label>
                  <select
                    value={reviewStatus}
                    onChange={e => setReviewStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2 bg-white font-bold text-slate-900 focus:border-[#0B2545] focus:outline-hidden"
                  >
                    <option value="ACCEPTED">ACCEPT — Verified for Field Inspection Scheduling</option>
                    <option value="NEEDS_CORRECTION">NEEDS CORRECTION — Return to Applicant with Remarks</option>
                    <option value="REJECTED">REJECT — Deny Verification Request</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Scrutiny Remarks / Justification (Official Record)
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="e.g. Documentation verified. Proceed with field inspection scheduling."
                    className="w-full p-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2 bg-[#0B2545] hover:bg-slate-800 text-white font-bold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? 'Recording Scrutiny...' : 'Commit Scrutiny Determination'}
                </button>
              </form>
            </div>
          )}

          {/* Action Step 2: Scheduling & Verifier Allocation Form */}
          {canSchedule && (
            <div className="bg-white rounded border border-blue-300 p-4 shadow-2xs space-y-3">
              <div className="border-b border-blue-200 pb-2 flex items-center justify-between">
                <h3 className="font-bold text-xs text-[#0B2545] uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-blue-700" />
                  Field Roster Scheduling & Verifier Allocation
                </h3>
                <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  Operational Step
                </span>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Inspection Date *</label>
                    <input
                      type="date"
                      required
                      value={schedDate}
                      onChange={e => setSchedDate(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono focus:border-[#0B2545] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Time Slot Window *</label>
                    <input
                      type="text"
                      required
                      value={timeWindow}
                      onChange={e => setTimeWindow(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs focus:border-[#0B2545] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verification Authority Category</label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 text-[11px]">
                      <input
                        type="radio"
                        name="assignType"
                        value="LMO"
                        checked={assignType === 'LMO'}
                        onChange={() => setAssignType('LMO')}
                      />
                      Department Officer (LMO)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 text-[11px]">
                      <input
                        type="radio"
                        name="assignType"
                        value="GATC"
                        checked={assignType === 'GATC'}
                        onChange={() => setAssignType('GATC')}
                      />
                      Approved Test Centre (GATC)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Designated Officer *</label>
                  <select
                    required
                    value={selectedVerifierId}
                    onChange={e => setSelectedVerifierId(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 bg-white font-medium text-slate-900 text-xs focus:border-[#0B2545] focus:outline-hidden"
                  >
                    {verifiers
                      .filter(v => v.role === assignType)
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.full_name} ({v.designation || v.role}) — {v.district || 'Central HQ'}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Field Directives / Special Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Conduct eccentricity test and verify lead stamping"
                    value={schedNotes}
                    onChange={e => setSchedNotes(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs focus:border-[#0B2545] focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingSchedule}
                  className="w-full py-2 bg-[#0B2545] hover:bg-slate-800 text-white font-bold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingSchedule ? 'Scheduling Case...' : 'Schedule & Assign Case to Officer'}
                </button>
              </form>
            </div>
          )}

          {/* Active Schedule & Allocation Record */}
          {application.schedule && !canSchedule && (
            <div className="bg-white rounded border border-slate-300 p-4 shadow-2xs space-y-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Active Field Inspection Assignment
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Scheduled Date:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {new Date(application.schedule.scheduled_date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Time Window:</span>
                  <span className="font-mono text-slate-800">{application.schedule.time_window}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Assigned Verifier:</span>
                  <span className="font-bold text-slate-900">
                    {application.assignment?.assigned_to_name} ({application.assignment?.assigned_to_type})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Location Address:</span>
                  <span className="text-slate-700 text-right max-w-[200px] truncate">{application.schedule.location_address}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Verification Status Transition History Table */}
      <div className="bg-white rounded border border-slate-300 p-5 shadow-2xs space-y-3">
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Verification Audit Ledger & State Transition History
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            {timelineEvents.length} Recorded Transition{timelineEvents.length === 1 ? '' : 's'}
          </span>
        </div>
        <Timeline events={timelineEvents} />
      </div>

    </div>
  );
};
