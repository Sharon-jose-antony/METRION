import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Instrument } from '../../types';
import { ArrowLeft, AlertCircle, Upload, FileText, CheckCircle2, Cpu, Calendar, ShieldCheck } from 'lucide-react';

export const NewApplication: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [instrumentId, setInstrumentId] = useState<number | ''>('');
  const [appType, setAppType] = useState<'NEW_VERIFICATION' | 'RE_VERIFICATION'>('NEW_VERIFICATION');
  const [proposedDate, setProposedDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.instruments.list().then(list => {
      setInstruments(list);

      const queryInstId = searchParams.get('instrument_id');
      const queryType = searchParams.get('type') as 'NEW_VERIFICATION' | 'RE_VERIFICATION';

      if (queryInstId) {
        setInstrumentId(Number(queryInstId));
      } else if (list.length > 0) {
        setInstrumentId(list[0].id);
      }

      if (queryType) {
        setAppType(queryType);
      }
    }).catch(console.error);
  }, [searchParams]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(prev => [...prev, e.target.files![0].name]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instrumentId) {
      setError('Please select a registered instrument.');
      return;
    }
    if (!declarationAccepted) {
      setError('You must accept the verification declaration before submitting.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.applications.create({
        instrument_id: Number(instrumentId),
        application_type: appType,
        proposed_date: proposedDate ? new Date(proposedDate).toISOString() : undefined,
        remarks: remarks.trim() || undefined,
      });
      navigate(`/owner/applications/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification application.');
    } finally {
      setLoading(false);
    }
  };

  const selectedInstrument = instruments.find(i => i.id === Number(instrumentId));

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans text-slate-800">
      
      {/* Top Back Link */}
      <div>
        <Link
          to="/owner/applications"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Verification Applications
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          New Verification Application
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit an application for initial verification or periodic re-verification of a weighing or measuring instrument.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 1. INSTRUMENT SELECTION */}
        <div className="bg-white rounded border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Instrument Selection
            </h2>
            <p className="text-[11px] text-slate-500">
              Select the registered instrument requiring physical field inspection
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Instrument *
            </label>
            {instruments.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600">
                No registered instruments found under your account.{' '}
                <Link to="/owner/instruments/new" className="text-blue-600 font-semibold underline">
                  Register an instrument first
                </Link>.
              </div>
            ) : (
              <select
                required
                value={instrumentId}
                onChange={e => setInstrumentId(Number(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded p-2 bg-white font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
              >
                {instruments.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.instrument_id} — {inst.manufacturer} {inst.model} (S/N: {inst.serial_number}) [{inst.current_status}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedInstrument && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Permanent ID</span>
                <span className="font-mono font-bold text-blue-900">{selectedInstrument.instrument_id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
                <span className="font-medium text-slate-800 truncate block">{selectedInstrument.category_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capacity</span>
                <span className="font-mono font-medium text-slate-800">{selectedInstrument.capacity || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Status</span>
                <span className="font-medium text-slate-800">{selectedInstrument.current_status}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. VERIFICATION TYPE */}
        <div className="bg-white rounded border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Verification Type
            </h2>
            <p className="text-[11px] text-slate-500">
              Specify whether this is a first-time verification or periodic re-verification
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`p-3 rounded border cursor-pointer transition-colors flex items-start gap-2.5 ${
              appType === 'NEW_VERIFICATION' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="appType"
                value="NEW_VERIFICATION"
                checked={appType === 'NEW_VERIFICATION'}
                onChange={() => setAppType('NEW_VERIFICATION')}
                className="mt-0.5 text-blue-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Initial Verification</span>
                <span className="text-[11px] text-slate-500">Verification and stamping before initial commercial use.</span>
              </div>
            </label>

            <label className={`p-3 rounded border cursor-pointer transition-colors flex items-start gap-2.5 ${
              appType === 'RE_VERIFICATION' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="appType"
                value="RE_VERIFICATION"
                checked={appType === 'RE_VERIFICATION'}
                onChange={() => setAppType('RE_VERIFICATION')}
                className="mt-0.5 text-blue-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Periodic Re-verification</span>
                <span className="text-[11px] text-slate-500">Mandatory periodic calibration and re-stamping before certificate expiry.</span>
              </div>
            </label>
          </div>
        </div>

        {/* 3. PROPOSED DATE & LOGISTICS */}
        <div className="bg-white rounded border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Proposed Inspection Window
            </h2>
            <p className="text-[11px] text-slate-500">
              Suggest preferred date and operational timing for the on-site inspector
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Inspection Date
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={e => setProposedDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:border-blue-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Official scheduling will be finalized upon administrative review.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Directives / Operating Hours
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Facility accessible between 09:00 - 17:00. Working standards access available at gate."
                className="w-full text-xs p-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 4. SUPPORTING DOCUMENTS */}
        <div className="bg-white rounded border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4. Supporting Documents
            </h2>
            <p className="text-[11px] text-slate-500">
              Upload invoice, maker plate photo, or prior calibration certificate if available
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Document / Photo
            </button>
            <span className="text-[11px] text-slate-400">PDF, JPG, PNG accepted (max 10MB)</span>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {uploadedFiles.map((fn, idx) => (
                <div key={idx} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs flex items-center gap-1.5 font-mono text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>{fn}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. REVIEW & STATUTORY DECLARATION */}
        <div className="bg-white rounded border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              5. Review & Declaration
            </h2>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
            <input
              type="checkbox"
              required
              checked={declarationAccepted}
              onChange={e => setDeclarationAccepted(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-0"
            />
            <span className="leading-relaxed">
              I hereby apply for verification/re-verification of the instrument described above. I confirm that the technical specifications provided match the physical equipment, and I undertake to provide reasonable access to the instrument and test area for the authorized verifying officer.
            </span>
          </label>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              to="/owner/applications"
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || instruments.length === 0}
              className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting Application...' : 'Submit Verification Application'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
