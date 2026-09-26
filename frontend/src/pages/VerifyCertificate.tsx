import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PublicCertificateVerify } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Calendar,
  Scale,
  QrCode,
  ArrowLeft,
  Printer,
  ShieldCheck,
  FileText,
  BadgeCheck,
  Hash,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  Award
} from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicCertificateVerify | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState(token || '');

  useEffect(() => {
    if (!token) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setTokenInput(token);
    setLoading(true);
    api.public.verifyCertificate(token)
      .then(res => {
        setData(res);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Certificate record not found in national registry.');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/verify/${tokenInput.trim()}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isCurrent = data?.authenticity_status === 'VALID' || (data?.authenticity_status as string) === 'CURRENT';
  const isExpired = data?.authenticity_status === 'EXPIRED';
  const isRevoked = data?.authenticity_status === 'REVOKED';

  // Calculate days remaining or days expired
  let daysDiff: number | null = null;
  if (data?.valid_until_date) {
    const validUntil = new Date(data.valid_until_date).getTime();
    const now = new Date().getTime();
    daysDiff = Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="max-w-4xl mx-auto my-4 space-y-5 font-sans text-slate-800">
      
      {/* Top Back Link & Prototype Pill - Hidden on Print */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to METRION Portal
        </Link>
        <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          SIH26036 Public Registry Check
        </span>
      </div>

      {/* Query Bar with Real Working Demo Presets - Hidden on Print */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded text-blue-700">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Statutory Certificate Authentication
              </h1>
              <p className="text-[11px] text-slate-500">
                Scan QR or enter Certificate ID / permanent token to verify authenticity
              </p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Rule 27 Verification
          </span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g. LM-CERT-2026-000001) or QR Token..."
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <ShieldCheck className="w-4 h-4" /> Authenticate
          </button>
        </form>

        {/* Demo Preset Buttons for Evaluators */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
            Evaluator Presets:
          </span>

          <button
            type="button"
            onClick={() => navigate('/verify/a1b2c3d4e5f67890abcdef1234567890')}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] cursor-pointer flex items-center gap-1 font-semibold transition-colors"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid (Avery Scale)
          </button>

          <button
            type="button"
            onClick={() => navigate('/verify/b2c3d4e5f6a17890abcdef1234567891')}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] cursor-pointer flex items-center gap-1 font-semibold transition-colors"
          >
            <Clock className="w-3 h-3 text-amber-600" /> Expiring (12 Days Warning)
          </button>

          <button
            type="button"
            onClick={() => navigate('/verify/c3d4e5f6a1b27890abcdef1234567892')}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] cursor-pointer flex items-center gap-1 font-semibold transition-colors"
          >
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Expired (Weighbridge)
          </button>

          <button
            type="button"
            onClick={() => navigate('/verify/LM-CERT-2026-000001')}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[11px] cursor-pointer flex items-center gap-1 font-semibold transition-colors font-mono"
          >
            <Hash className="w-3 h-3 text-blue-600" /> By Cert ID: LM-CERT-2026-000001
          </button>

          <button
            type="button"
            onClick={() => navigate('/verify/counterfeit_tampered_fake_token_999')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] cursor-pointer flex items-center gap-1 font-medium transition-colors"
          >
            <XCircle className="w-3 h-3 text-slate-500" /> Counterfeit / Fake QR
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-medium">Validating cryptographic QR signature against METRION database...</p>
        </div>
      )}

      {/* INVALID / COUNTERFEIT STATE */}
      {error && !loading && (
        <div className="bg-white rounded-xl border-2 border-rose-300 p-8 sm:p-10 text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border-2 border-rose-200 shadow-inner">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-700 font-bold bg-rose-100 px-2.5 py-0.5 rounded-full inline-block">
              STATUTORY ALERT: UNVERIFIED / COUNTERFEIT
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-2">
              NO STATUTORY RECORD FOUND
            </h2>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              The scanned token or Certificate ID does not correspond to any valid verification issued under the Legal Metrology Act, 2009. Commercial transaction using an unstamped or counterfeit instrument is unlawful under Section 30.
            </p>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 max-w-md mx-auto truncate">
            Scanned Token: <span className="font-bold text-rose-700">{token}</span>
          </div>
        </div>
      )}

      {/* AUTHENTIC / VALID / EXPIRED RESULT VIEW */}
      {data && !loading && (
        <div className="space-y-4">
          
          {/* Action Toolbar - Hidden on Print */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2 print:hidden shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900">Certificate Status Authenticated</span>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-slate-500 text-[11px] truncate max-w-[220px]">
                {data.certificate_number}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Certificate
              </button>
              <a
                href={api.getUploadUrl(`uploads/cert_${data.certificate_number}.pdf`)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white font-semibold rounded text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Download Form VII PDF
              </a>
            </div>
          </div>

          {/* Official Statutory Certificate Card */}
          <div className="bg-white rounded-xl border border-slate-300 p-6 sm:p-8 space-y-6 shadow-sm print:border-none print:shadow-none print:p-0 relative overflow-hidden">
            
            {/* Top Certificate Header */}
            <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-5">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg">🏛️</span>
                <span className="font-bold text-xs uppercase tracking-widest text-slate-700">
                  Government of India • State Legal Metrology Department
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                CERTIFICATE OF VERIFICATION (FORM VII)
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                [Issued under Rule 27 of the Legal Metrology (General) Rules, 2011]
              </p>
            </div>

            {/* Official Holographic & Status Seal Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isCurrent
                ? 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 border-emerald-300'
                : isExpired
                ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-amber-300'
                : 'bg-gradient-to-r from-rose-50 via-white to-rose-50/50 border-rose-300'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  isCurrent
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : isExpired
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                }`}>
                  {isCurrent && <CheckCircle2 className="w-7 h-7" />}
                  {isExpired && <AlertTriangle className="w-7 h-7" />}
                  {isRevoked && <XCircle className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isExpired
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {data.authenticity_status}
                    </span>
                    {daysDiff !== null && isCurrent && (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        • Valid for {daysDiff} more days
                      </span>
                    )}
                    {daysDiff !== null && isExpired && (
                      <span className="text-[11px] font-bold text-rose-700">
                        • Expired {Math.abs(daysDiff)} days ago
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {isCurrent && "Instrument Stamped & Approved for Legal Commercial Transactions"}
                    {isExpired && "Verification Expired — Instrument Unlawful for Use until Re-verified"}
                    {isRevoked && "Statutory Revocation — Security Stamp Voided"}
                  </h3>
                </div>
              </div>

              {/* Holographic Sim Badge */}
              <div className="hologram-seal px-3 py-2 rounded-lg border border-amber-300/80 text-center shrink-0">
                <div className="text-[9px] font-mono uppercase font-bold text-amber-900 tracking-wider">
                  OFFICIAL LEGAL METROLOGY SEAL
                </div>
                <div className="text-xs font-mono font-extrabold text-blue-950">
                  STAMP ID: {data.certificate_number}
                </div>
              </div>
            </div>

            {/* Certificate Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Instrument Particulars */}
              <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" /> Verified Instrument Particulars
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Permanent ID:</span>
                    <span className="font-mono font-bold text-slate-900">{data.instrument_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Make & Model:</span>
                    <span className="font-medium text-slate-900">{data.manufacturer} {data.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Serial Number:</span>
                    <span className="font-mono font-bold text-slate-800">{data.serial_number_masked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-slate-800">{data.instrument_category}</span>
                  </div>
                </div>
              </div>

              {/* Verification & Authority Particulars */}
              <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verification Particulars
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Certificate Number:</span>
                    <span className="font-mono font-bold text-blue-900">{data.certificate_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verification Date:</span>
                    <span className="font-mono text-slate-800">
                      {new Date(data.verification_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valid Until:</span>
                    <span className={`font-mono font-bold ${isExpired ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {new Date(data.valid_until_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verifying Officer:</span>
                    <span className="font-medium text-slate-900">{data.verifier_name} ({data.verifier_role})</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Issuing Authority & Legal Statement */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-800">
                {data.issuing_authority}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {data.disclaimer}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
