import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Instrument, Certificate } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import {
  Cpu,
  ShieldCheck,
  Download,
  QrCode,
  FileCheck2,
  RefreshCw,
  ArrowLeft,
  MapPin,
  History,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const InstrumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);
  const [allCerts, setAllCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'CERTIFICATES' | 'DOCUMENTS'>('OVERVIEW');

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.instruments.get(Number(id)),
      api.instruments.getHistory(Number(id)),
      api.certificates.list().catch(() => [])
    ])
      .then(([inst, hist, certs]) => {
        setInstrument(inst);
        setHistory(hist.timeline || []);

        const instCerts = (certs || []).filter(c => c.instrument_id === Number(id) || c.instrument_permanent_id === inst.instrument_id);
        setAllCerts(instCerts);

        if (inst.active_certificate_id) {
          api.certificates.get(inst.active_certificate_id)
            .then(setActiveCert)
            .catch(() => {});
        } else if (instCerts.length > 0) {
          setActiveCert(instCerts[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !instrument) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isVerified = instrument.current_status === 'VERIFIED';

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-sans text-slate-800">
      
      {/* Top Back Link */}
      <div>
        <Link
          to="/owner/instruments"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Registered Instruments
        </Link>
      </div>

      {/* Main Instrument Registry Dossier Header */}
      <div className="bg-white rounded border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-slate-900 text-white rounded flex items-center justify-center shrink-0 shadow-2xs">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {instrument.instrument_id}
                </span>
                <StatusBadge status={instrument.current_status} size="sm" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {instrument.manufacturer} — {instrument.model}
              </h1>
              <p className="text-xs text-slate-500">
                Serial No: <span className="font-mono text-slate-800 font-semibold">{instrument.serial_number}</span>
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            <button
              onClick={() => navigate(`/owner/applications/new?instrument_id=${instrument.id}&type=${isVerified ? 'RE_VERIFICATION' : 'NEW_VERIFICATION'}`)}
              className="px-3.5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isVerified ? <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> : <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />}
              {isVerified ? 'Apply for Re-verification' : 'Apply for Verification'}
            </button>
          </div>
        </div>

        {/* Compact Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Owner</span>
            <span className="font-semibold text-slate-800 truncate block">{instrument.owner_name}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location</span>
            <span className="font-semibold text-slate-800 truncate block">
              {instrument.district ? `${instrument.district}, ${instrument.state}` : instrument.installation_address}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capacity</span>
            <span className="font-semibold text-slate-800 font-mono">{instrument.capacity || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
            <span className="font-semibold text-slate-800 truncate block">{instrument.category_name}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>VERIFICATION HISTORY</span>
            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
              {history.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('CERTIFICATES')}
            className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CERTIFICATES'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>CERTIFICATES</span>
            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
              {allCerts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'DOCUMENTS'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            DOCUMENTS
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              
              {/* Technical Specifications */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Maximum Capacity</span>
                    <span className="font-semibold text-slate-800 font-mono text-sm">{instrument.capacity || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accuracy Class</span>
                    <span className="font-semibold text-slate-800 font-mono text-sm">{instrument.accuracy_class || 'Class III'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Serial Number</span>
                    <span className="font-semibold text-slate-800 font-mono text-sm">{instrument.serial_number}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Year of Manufacture</span>
                    <span className="font-semibold text-slate-800 font-mono text-sm">{instrument.year_of_manufacture || '2025'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
                    <span className="font-semibold text-slate-800 font-mono text-sm">{instrument.category_name || 'Weighing Instrument'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Registration Date</span>
                    <span className="font-semibold text-slate-800 font-mono text-sm">
                      {new Date(instrument.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location & Establishment */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
                  Installation Premise & Location
                </h3>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">{instrument.installation_address}</p>
                    <p className="text-slate-500 mt-0.5">
                      {instrument.district}, {instrument.state} — {instrument.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Digital Certificate Card */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
                  Current Verification Standing
                </h3>
                {activeCert ? (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{activeCert.certificate_number}</span>
                        <StatusBadge status={activeCert.status} size="sm" />
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Valid from <span className="font-mono font-medium text-slate-800">{new Date(activeCert.issue_date).toLocaleDateString('en-IN')}</span> until <span className="font-mono font-bold text-slate-900">{new Date(activeCert.valid_until_date).toLocaleDateString('en-IN')}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/verify/${activeCert.qr_token}`}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded border border-slate-300 text-xs flex items-center gap-1 transition-colors"
                      >
                        <QrCode className="w-3 h-3 text-blue-600" /> Verify QR
                      </Link>
                      <a
                        href={`/uploads/cert_${activeCert.certificate_number}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded text-xs flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Download className="w-3 h-3" /> Download PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 italic text-center">
                    No active certificate on record. Lodge a verification application to start inspection.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: VERIFICATION HISTORY (Vertical Lifecycle Timeline) */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Permanent Lifecycle Timeline
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    One Permanent ID ({instrument.instrument_id}) → Multiple Verification Cycles → Complete History
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {history.length} Events Logged
                </span>
              </div>

              <Timeline events={history} />
            </div>
          )}

          {/* TAB 3: CERTIFICATES */}
          {activeTab === 'CERTIFICATES' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Digital Certificates Docket
                </h3>
                <p className="text-[11px] text-slate-500">
                  All Form VII verification certificates issued across historical calibration cycles
                </p>
              </div>

              {allCerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-50 rounded border border-slate-200">
                  No certificates issued yet for this instrument.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Certificate ID</th>
                        <th className="py-2.5 px-3">Issued Date</th>
                        <th className="py-2.5 px-3">Valid Until</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-mono text-[11px]">
                      {allCerts.map((cert) => (
                        <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {cert.certificate_number}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {new Date(cert.issue_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-semibold">
                            {new Date(cert.valid_until_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <StatusBadge status={cert.status} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans space-x-1.5 whitespace-nowrap">
                            <Link
                              to={`/verify/${cert.qr_token}`}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] transition-colors inline-block border border-slate-200"
                            >
                              Verify QR
                            </Link>
                            <a
                              href={`/uploads/cert_${cert.certificate_number}.pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded text-[11px] transition-colors inline-block"
                            >
                              Download PDF
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Supporting Documents & Maker Plate Evidence
                </h3>
                <p className="text-[11px] text-slate-500">
                  Physical photos and compliance documents attached during registration and field verifications
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Maker Plate Photo</p>
                      <p className="text-[10px] text-slate-400 font-mono">maker_plate_stamping.jpg</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    Verified
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Model Approval Certificate</p>
                      <p className="text-[10px] text-slate-400 font-mono">model_approval_notice.pdf</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    Approved
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
