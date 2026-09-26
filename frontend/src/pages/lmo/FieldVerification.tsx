import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Application, ChecklistData, ObservationInput, VerificationResponse } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Scale,
  MapPin,
  Clock,
  ArrowLeft,
  Download,
  FileText,
  ShieldCheck,
  CheckSquare,
  SlidersHorizontal,
  XCircle,
  UserCheck
} from 'lucide-react';

export const FieldVerification: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field Verification Checklist Confirmation Flags
  const [idConfirmations, setIdConfirmations] = useState({
    confirmModel: true,
    confirmSerial: true,
    confirmDetails: true,
  });

  const [physicalConfirmations, setPhysicalConfirmations] = useState({
    physicalCondition: true,
    installationCondition: true,
    sealMarking: true,
  });

  // Security Seal & Standard Box Details
  const [sealNumber, setSealNumber] = useState('IN-SEAL-2026-' + Math.floor(100000 + Math.random() * 900000));
  const [standardsBoxId, setStandardsBoxId] = useState('STD-MASS-BOX-04');

  // Observations State
  const [observations, setObservations] = useState<Record<number, { value: string; isCompliant: boolean; remarks?: string }>>({});
  const [remarks, setRemarks] = useState('Physical calibration conducted using certified standard test weights. Instrument operates within permissible error limits.');
  const [result, setResult] = useState<'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW'>('VERIFIED');
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Success Modal
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.applications.get(Number(id)),
      api.verifications.getChecklist(Number(id))
    ])
      .then(([app, chk]) => {
        setApplication(app);
        setChecklistData(chk);

        // Pre-fill default observation values
        const initialObs: Record<number, { value: string; isCompliant: boolean; remarks?: string }> = {};
        chk.items.forEach(item => {
          if (item.field_type === 'BOOLEAN') {
            initialObs[item.id] = { value: 'Pass', isCompliant: true, remarks: 'Verified compliant' };
          } else if (item.field_type === 'NUMBER') {
            initialObs[item.id] = { value: '0.02', isCompliant: true, remarks: 'Within MPE limits' };
          } else {
            initialObs[item.id] = { value: 'Compliant', isCompliant: true, remarks: '' };
          }
        });
        setObservations(initialObs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleObservationChange = (itemId: number, value: string, isCompliant: boolean, itemRemarks?: string) => {
    setObservations(prev => ({
      ...prev,
      [itemId]: {
        value,
        isCompliant,
        remarks: itemRemarks !== undefined ? itemRemarks : prev[itemId]?.remarks
      }
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !application) return;
    const file = e.target.files[0];
    setUploadingPhoto(true);

    try {
      const res = await api.verifications.uploadEvidence(application.id, file, 'MAKER_PLATE');
      setUploadedPhotos(prev => [...prev, res]);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !checklistData) return;

    if (!idConfirmations.confirmModel || !idConfirmations.confirmSerial || !idConfirmations.confirmDetails) {
      setError('All instrument identification checks must be verified by the officer.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const obsPayload: ObservationInput[] = Object.entries(observations).map(([itemId, obs]) => ({
        checklist_item_id: Number(itemId),
        value_entered: obs.value,
        is_compliant: obs.isCompliant,
        remarks: obs.remarks || undefined
      }));

      const finalRemarks = `[SEAL NO: ${sealNumber}] [STANDARDS BOX: ${standardsBoxId}] ${remarks}`;

      const res = await api.verifications.submit({
        application_id: application.id,
        rule_version_id: checklistData.rule_version_id,
        result,
        verifier_remarks: finalRemarks,
        observations: obsPayload
      });

      setVerificationResult(res);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !application || !checklistData) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const officerName = user?.full_name || 'Assigned Officer';

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="bg-white rounded border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <Link
            to="/lmo/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Field Duty Roster
          </Link>
          <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
            Form VII Inspection
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                FIELD VERIFICATION
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-bold text-xs text-slate-900">
                {application.instrument_permanent_id || 'LM-INST-XXXXXX'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {application.instrument_name || 'Commercial Instrument'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Status: <StatusBadge status={application.status} size="sm" /></span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Assigned Officer: {officerName} • LMO
              </span>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Application</span>
            <span className="font-mono font-bold text-xs text-slate-900 block">{application.application_number}</span>
            <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{application.schedule?.time_window || 'Today'}</span>
          </div>
        </div>

        {/* Compact Progress Indicator (Numbered Steps) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-5 gap-1 text-center text-xs">
            <div className="py-1.5 bg-blue-50 text-blue-900 font-semibold rounded border border-blue-200">
              <span className="font-mono text-[10px] block text-blue-600">01</span>
              <span className="text-[11px]">Instrument</span>
            </div>
            <div className="py-1.5 bg-blue-50 text-blue-900 font-semibold rounded border border-blue-200">
              <span className="font-mono text-[10px] block text-blue-600">02</span>
              <span className="text-[11px]">Checklist</span>
            </div>
            <div className="py-1.5 bg-blue-50 text-blue-900 font-semibold rounded border border-blue-200">
              <span className="font-mono text-[10px] block text-blue-600">03</span>
              <span className="text-[11px]">Observations</span>
            </div>
            <div className="py-1.5 bg-blue-50 text-blue-900 font-semibold rounded border border-blue-200">
              <span className="font-mono text-[10px] block text-blue-600">04</span>
              <span className="text-[11px]">Evidence</span>
            </div>
            <div className="py-1.5 bg-blue-50 text-blue-900 font-semibold rounded border border-blue-200">
              <span className="font-mono text-[10px] block text-blue-600">05</span>
              <span className="text-[11px]">Result</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 rounded font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Inspection Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* STEP 1: Instrument Identification Check */}
        <div className="bg-white rounded border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              01. Instrument Identification & Physical Condition
            </h2>
            <p className="text-[11px] text-slate-500">
              Verify nameplate markings, serial number, and physical condition of the instrument
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100/70 cursor-pointer text-xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={idConfirmations.confirmModel}
                  onChange={e => setIdConfirmations(prev => ({ ...prev, confirmModel: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Instrument Identification</span>
                  <span className="text-[11px] text-slate-500">Manufacturer nameplate, model mark, and serial number verified on chassis.</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${idConfirmations.confirmModel ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                PASS
              </span>
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100/70 cursor-pointer text-xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={physicalConfirmations.physicalCondition}
                  onChange={e => setPhysicalConfirmations(prev => ({ ...prev, physicalCondition: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Physical & Environmental Condition</span>
                  <span className="text-[11px] text-slate-500">Level indicator centered, rigid foundation, no mechanical interference on load receptor.</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${physicalConfirmations.physicalCondition ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                PASS
              </span>
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100/70 cursor-pointer text-xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={idConfirmations.confirmSerial}
                  onChange={e => setIdConfirmations(prev => ({ ...prev, confirmSerial: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Sealing Provisions & Calibration Port</span>
                  <span className="text-[11px] text-slate-500">Calibration adjustment port protected; lead wire sealing holes intact.</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${idConfirmations.confirmSerial ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                PASS
              </span>
            </label>
          </div>
        </div>

        {/* STEP 2 & 3: Structured Inspection Checklist & Observations */}
        <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                02 & 03. Verification Checklist & Observations
              </h2>
              <p className="text-[11px] text-slate-500">
                Protocol: {checklistData.checklist_name} ({checklistData.rule_version_code})
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 text-[11px]">Standards Box:</span>
              <input
                type="text"
                value={standardsBoxId}
                onChange={e => setStandardsBoxId(e.target.value)}
                className="bg-white border border-slate-300 px-2 py-0.5 text-xs font-mono font-medium text-slate-800 rounded"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 p-4 space-y-3">
            {checklistData.items.map((item, idx) => {
              const current = observations[item.id] || { value: '0.02', isCompliant: true, remarks: '' };

              return (
                <div
                  key={item.id}
                  className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Item Label and Tolerance */}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400">0{idx + 1}.</span>
                      <span className="font-semibold text-slate-900">{item.label}</span>
                      {item.required && <span className="text-rose-600 font-bold">*</span>}
                    </div>
                    {item.help_text && (
                      <p className="text-[11px] text-slate-500 leading-tight">{item.help_text}</p>
                    )}
                    {item.max_value !== null && (
                      <span className="inline-block text-[10px] text-slate-500 font-mono">
                        Permissible Range: 0.00 – {item.max_value} {item.unit || 'g'}
                      </span>
                    )}
                  </div>

                  {/* Right: Observed Input & Pass/Fail Toggle */}
                  <div className="flex items-center gap-3 shrink-0">
                    {item.field_type === 'NUMBER' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Observed:</span>
                        <input
                          type="number"
                          step="any"
                          required={item.required}
                          value={current.value}
                          onChange={e => handleObservationChange(item.id, e.target.value, current.isCompliant)}
                          className="w-20 text-xs font-mono font-semibold px-2 py-1 border border-slate-300 rounded bg-white focus:border-blue-600 focus:outline-hidden"
                        />
                        <span className="text-slate-400 font-mono text-[11px]">{item.unit || 'g'}</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        required={item.required}
                        value={current.value}
                        onChange={e => handleObservationChange(item.id, e.target.value, current.isCompliant)}
                        className="w-28 text-xs px-2 py-1 border border-slate-300 rounded bg-white focus:border-blue-600 focus:outline-hidden"
                      />
                    )}

                    <div className="inline-flex rounded border border-slate-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleObservationChange(item.id, current.value || 'Pass', true)}
                        className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          current.isCompliant
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        PASS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleObservationChange(item.id, current.value || 'Fail', false)}
                        className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer border-l border-slate-300 ${
                          !current.isCompliant
                            ? 'bg-rose-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        FAIL
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 4: Evidence Capture (Photos & Documents) */}
        <div className="bg-white rounded border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              04. Photographic Evidence & Stamping Seal
            </h2>
            <p className="text-[11px] text-slate-500">
              Record physical lead seal / barcode number and attach photograph of maker plate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Lead Seal / Barcode Stamp Number *
              </label>
              <input
                type="text"
                required
                value={sealNumber}
                onChange={e => setSealNumber(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Permanently recorded on the generated Form VII certificate.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                On-Site Photo Evidence
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-xs rounded inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  {uploadingPhoto ? 'Uploading Photo...' : 'Capture Photo'}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-xs rounded inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Upload Document
                </button>
              </div>

              {uploadedPhotos.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {uploadedPhotos.map((photo, pIdx) => (
                    <div key={pIdx} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded flex items-center gap-1.5 text-xs font-mono text-slate-700">
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span className="text-[11px] truncate max-w-[150px]">{photo.file_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic pt-1">No photographic evidence attached yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* STEP 5: Verification Result & Officer Declaration */}
        <div className="bg-white rounded border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              05. Verification Result & Officer Declaration
            </h2>
            <p className="text-[11px] text-slate-500">
              Select final verification outcome and confirm official determination
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">Verification Result:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className={`p-3 rounded border cursor-pointer transition-colors flex items-center gap-2.5 ${
                result === 'VERIFIED' ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="verdict"
                  value="VERIFIED"
                  checked={result === 'VERIFIED'}
                  onChange={() => setResult('VERIFIED')}
                  className="text-emerald-600"
                />
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">PASS</span>
                  <span className="text-[11px] text-slate-600">Issue Form VII Digital Certificate</span>
                </div>
              </label>

              <label className={`p-3 rounded border cursor-pointer transition-colors flex items-center gap-2.5 ${
                result === 'REJECTED' ? 'border-rose-600 bg-rose-50/60 ring-1 ring-rose-600' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="verdict"
                  value="REJECTED"
                  checked={result === 'REJECTED'}
                  onChange={() => setResult('REJECTED')}
                  className="text-rose-600"
                />
                <div>
                  <span className="text-xs font-bold text-rose-900 block">FAIL</span>
                  <span className="text-[11px] text-slate-600">Issue Non-Compliance Notice</span>
                </div>
              </label>

              <label className={`p-3 rounded border cursor-pointer transition-colors flex items-center gap-2.5 ${
                result === 'NEEDS_REVIEW' ? 'border-amber-600 bg-amber-50/60 ring-1 ring-amber-600' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="verdict"
                  value="NEEDS_REVIEW"
                  checked={result === 'NEEDS_REVIEW'}
                  onChange={() => setResult('NEEDS_REVIEW')}
                  className="text-amber-600"
                />
                <div>
                  <span className="text-xs font-bold text-amber-900 block">CORRECTION REQUIRED</span>
                  <span className="text-[11px] text-slate-600">Re-test / Adjustment Order</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Officer Observations & Test Notes *
            </label>
            <textarea
              rows={2}
              required
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Record calibration findings, lead seal details, and official remarks..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden font-mono"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-xs rounded shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              {submitting ? 'Submitting Verification...' : 'Submit Verification Result'}
            </button>
          </div>
        </div>

      </form>

      {/* Success Modal */}
      {showSuccessModal && verificationResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 max-w-md w-full p-6 shadow-xl text-center space-y-4">
            <div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {verificationResult.result === 'VERIFIED' ? 'Verification Completed' : 'Determination Recorded'}
              </h3>
              <p className="text-xs text-slate-500">
                {verificationResult.result === 'VERIFIED'
                  ? 'Digital verification certificate generated and committed to the registry.'
                  : 'Field verification findings recorded in the application dossier.'}
              </p>
            </div>

            {verificationResult.certificate_number && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-left space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase text-[10px]">Certificate Number:</span>
                  <span className="font-bold text-blue-900">{verificationResult.certificate_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase text-[10px]">Seal Number:</span>
                  <span className="font-bold text-slate-800">{sealNumber}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {verificationResult.certificate_id && (
                <a
                  href={api.certificates.getPdfUrl(verificationResult.certificate_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-xs rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </a>
              )}

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/lmo/dashboard');
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition-colors cursor-pointer"
              >
                Return to Roster
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
