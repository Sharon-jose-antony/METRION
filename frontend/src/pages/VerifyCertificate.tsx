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
  RefreshCw
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
        setError(err.message || 'Certificate record not found.');
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

  return (
    <div className="max-w-3xl mx-auto my-4 space-y-4 font-sans text-slate-800">
      
      {/* Top Back Link - Hidden on Print */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to METRION
        </Link>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          SIH26036 Authentication
        </span>
      </div>

      {/* Query Bar with Demo Preset Chips - Hidden on Print */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs space-y-3 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-blue-600" /> Certificate Authentication
            </h1>
            <p className="text-[11px] text-slate-500">
              Query certificate validity by QR token or certificate identifier
            </p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            Public Lookup
          </span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter QR token / Certificate ID"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              className="w-full text-xs font-mono pl-8.5 pr-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-medium rounded shrink-0 cursor-pointer transition-colors shadow-2xs"
          >
            Authenticate
          </button>
        </form>

        {/* Demo Preset Tokens */}
        <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demo Presets:</span>
          <button
            type="button"
            onClick={() => navigate('/verify/a1b2c3d4e5f67890abcdef1234567890')}
            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] cursor-pointer flex items-center gap-1 font-medium transition-colors"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Current / Valid
          </button>
          <button
            type="button"
            onClick={() => navigate('/verify/c3d4e5f6a1b27890abcdef1234567892')}
            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] cursor-pointer flex items-center gap-1 font-medium transition-colors"
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Expired Token
          </button>
          <button
            type="button"
            onClick={() => navigate('/verify/revoked_token_demo_sample_999')}
            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] cursor-pointer flex items-center gap-1 font-medium transition-colors"
          >
            <XCircle className="w-3 h-3 text-rose-600" /> Revoked Token
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-8 rounded border border-slate-200 text-center space-y-2">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Verifying certificate against METRION records...</p>
        </div>
      )}

      {/* INVALID / NOT FOUND STATE */}
      {error && !loading && (
        <div className="bg-white rounded border border-rose-200 p-6 sm:p-8 text-center space-y-3 shadow-2xs">
          <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 font-bold block">
              STATUS: INVALID / UNKNOWN
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">INVALID CERTIFICATE TOKEN</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              No matching certificate record was found in the METRION database for this QR token. The token may be invalid, counterfeit, or mistyped.
            </p>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-600 max-w-sm mx-auto truncate">
            {token}
          </div>
          <div className="pt-2 text-[11px] text-slate-400">
            Verified against METRION certificate records
          </div>
        </div>
      )}

      {/* AUTHENTIC / VALID / EXPIRED / REVOKED RESULT VIEW */}
      {data && !loading && (
        <div className="space-y-4">
          
          {/* Action Toolbar - Hidden on Print */}
          <div className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between gap-2 print:hidden shadow-2xs">
            <div className="flex items-center gap-2 text-xs">
              <BadgeCheck className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-800">Authentication Result</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-slate-500 text-[11px] truncate max-w-[200px]">{token}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <a
                href={api.getUploadUrl(`uploads/cert_${data.certificate_number}.pdf`)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>
            </div>
          </div>

          {/* Centered Result Card */}
          <div className="bg-white rounded border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs print:border-none print:shadow-none print:p-0">
            
            {/* Centered Status Hero */}
            <div className="text-center space-y-2 border-b border-slate-100 pb-5">
              {isCurrent && (
                <>
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      AUTHENTIC CERTIFICATE
                    </h2>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      CURRENT
                    </span>
                  </div>
                </>
              )}

              {isExpired && (
                <>
                  <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      CERTIFICATE EXPIRED
                    </h2>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      EXPIRED
                    </span>
                    <p className="text-xs text-amber-800 mt-1">
                      This instrument has passed its validity window and requires periodic re-verification.
                    </p>
                  </div>
                </>
              )}

              {isRevoked && (
                <>
                  <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      CERTIFICATE REVOKED
                    </h2>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      REVOKED
                    </span>
                    <p className="text-xs text-rose-800 mt-1">
                      This certificate has been revoked due to statutory non-compliance or broken security seal.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Certificate Data Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Certificate Particulars
              </h3>

              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50/50">
                      <td className="py-2.5 px-3 w-1/3 font-semibold text-slate-600">Certificate ID:</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{data.certificate_number}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-600">Instrument ID:</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{data.instrument_id || 'LM-INST'}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-600">Instrument Model / Make:</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">
                        {data.manufacturer} {data.model} (S/N: {data.serial_number_masked})
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-600">Instrument Category:</td>
                      <td className="py-2.5 px-3 text-slate-700">{data.instrument_category || 'Weighing Instrument'}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-600">Verification Type:</td>
                      <td className="py-2.5 px-3 text-slate-800">
                        Periodic Verification
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-600">Issued Date:</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {new Date(data.verification_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-600">Valid Until:</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        <span className={isExpired ? 'text-rose-700' : 'text-slate-900'}>
                          {new Date(data.valid_until_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-600">Verifying Authority / Officer:</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">
                        {data.verifier_name} ({data.verifier_role})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Proof Statement */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-500 space-y-0.5">
              <p className="font-semibold text-slate-700">Verified against METRION certificate records</p>
              <p className="text-[11px] text-slate-400 font-mono">
                Permanent System Reference • SIH26036 Prototype Environment
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
