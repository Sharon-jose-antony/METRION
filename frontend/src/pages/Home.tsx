import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  QrCode,
  ArrowRight,
  Cpu,
  FileCheck2,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Search,
  Scale,
  Users,
  SlidersHorizontal,
  Lock
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user, login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');

  const handleQuickLogin = async (email: string) => {
    try {
      await login(email, 'DemoPass@123');
      if (email.includes('admin')) navigate('/admin/dashboard');
      else if (email.includes('owner')) navigate('/owner/dashboard');
      else if (email.includes('lmo')) navigate('/lmo/dashboard');
      else if (email.includes('gatc')) navigate('/gatc/dashboard');
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/verify/${tokenInput.trim()}`);
    }
  };

  return (
    <div className="space-y-6 pb-10 text-slate-800 font-sans">

      {/* Main Hero Header */}
      <section className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-[#0f172a] text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-600 rounded flex items-center justify-center text-white border border-blue-500 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">METRION</h1>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  SIH26036 Prototype
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Digital Verification & Certificate Lifecycle Platform
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Problem Statement SIH26036
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <strong className="font-semibold text-slate-900">METRION</strong> provides an online verification and certificate lifecycle system for weighing and measuring instruments. It unifies instrument registration, verification applications, administrative review, field inspection scheduling, on-site tolerance testing, digital certificate generation with QR authentication, and recurring re-verification cycles.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Built specifically for Problem Statement SIH26036, the platform anchors all verification events and certificates to a single permanent instrument identity.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                {user ? (
                  <Link
                    to={getDashboardPath()}
                    className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    Open Console <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    Sign In to Portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                <button
                  onClick={() => navigate('/verify/7ad974d6f45a4f479a95786720f491c6')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600" /> Verify Sample Certificate
                </button>
              </div>
            </div>

            {/* Quick Public Token Lookup Widget */}
            <div className="lg:col-span-4 bg-slate-50 rounded border border-slate-200 p-4 space-y-3">
              <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Quick Certificate Lookup
                </span>
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter QR token / Certificate ID"
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Authenticate Token
                </button>
              </form>

              <div className="text-[10px] text-slate-400 pt-1">
                Distinguishes: <span className="text-emerald-700 font-semibold">VALID</span>, <span className="text-amber-700 font-semibold">EXPIRED</span>, <span className="text-rose-700 font-semibold">REVOKED</span>, and <span className="text-slate-600 font-semibold">INVALID</span>.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Lifecycle Protocol Architecture */}
      <section className="bg-white rounded border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            End-to-End Verification Lifecycle Architecture
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            A controlled, multi-stakeholder operational workflow connecting every event to a permanent instrument ID
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          {[
            { step: '01', title: 'Register', role: 'Owner', desc: 'Permanent LM-INST-XXXXXX assigned' },
            { step: '02', title: 'Apply', role: 'Owner', desc: 'Initial or periodic re-verification' },
            { step: '03', title: 'Review', role: 'Admin', desc: 'Dossier scrutiny & approval' },
            { step: '04', title: 'Schedule', role: 'Admin', desc: 'Date allocation & officer assignment' },
            { step: '05', title: 'Verify', role: 'LMO / GATC', desc: 'Field checklist & tolerance tests' },
            { step: '06', title: 'Certify', role: 'System', desc: 'Form VII PDF with vector QR code' },
            { step: '07', title: 'Authenticate', role: 'Public', desc: 'Online QR token verification' },
          ].map((item) => (
            <div key={item.step} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="font-mono text-[10px] font-bold text-blue-600 block">STEP {item.step}</span>
              <p className="font-semibold text-xs text-slate-900">{item.title}</p>
              <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 inline-block">
                {item.role}
              </span>
              <p className="text-[11px] text-slate-500 leading-tight pt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stakeholder Demo Persona Directory */}
      <section className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Demo Stakeholder Personas
            </h2>
            <p className="text-[11px] text-slate-500">
              Quick access profiles for demonstration and testing of all system workflows
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
            SIH26036 Roles
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Persona 1: Owner */}
            <div className="border border-slate-200 rounded bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 inline-block">
                  OWNER
                </span>
                <h3 className="font-bold text-xs text-slate-900">Instrument Owner</h3>
                <p className="text-[11px] text-slate-600">
                  Register instruments, file verification applications, track processing state, and download digital certificates.
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-white p-1.5 rounded border border-slate-200 truncate">
                  owner@demo.legalmet.local
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('owner@demo.legalmet.local')}
                className="w-full py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Launch Owner Portal <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Persona 2: Admin */}
            <div className="border border-slate-200 rounded bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200 inline-block">
                  ADMIN
                </span>
                <h3 className="font-bold text-xs text-slate-900">Administrator</h3>
                <p className="text-[11px] text-slate-600">
                  Review applications, schedule inspections, assign verifying officers, manage rules, and inspect audit logs.
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-white p-1.5 rounded border border-slate-200 truncate">
                  admin@demo.legalmet.local
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('admin@demo.legalmet.local')}
                className="w-full py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Launch Admin Console <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Persona 3: LMO */}
            <div className="border border-slate-200 rounded bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 inline-block">
                  LMO
                </span>
                <h3 className="font-bold text-xs text-slate-900">Field Officer (LMO)</h3>
                <p className="text-[11px] text-slate-600">
                  Execute on-site field verification, record checklist observations, capture photo evidence, and submit test results.
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-white p-1.5 rounded border border-slate-200 truncate">
                  lmo@demo.legalmet.local
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('lmo@demo.legalmet.local')}
                className="w-full py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Launch Field Officer UI <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Persona 4: GATC */}
            <div className="border border-slate-200 rounded bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-200 inline-block">
                  GATC
                </span>
                <h3 className="font-bold text-xs text-slate-900">Test Centre (GATC)</h3>
                <p className="text-[11px] text-slate-600">
                  Perform delegated laboratory calibration and verification tests for heavy weighbridges and industrial scales.
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-white p-1.5 rounded border border-slate-200 truncate">
                  gatc@demo.legalmet.local
                </div>
              </div>
              <button
                onClick={() => handleQuickLogin('gatc@demo.legalmet.local')}
                className="w-full py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Launch Test Centre UI <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Core Operational Principles */}
      <section className="bg-white rounded border border-slate-200 shadow-2xs p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 mb-3">
          Key System Architecture Pillars
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="border-l-2 border-blue-600 pl-3 py-1 space-y-1">
            <h3 className="font-bold text-slate-900">Physical Field Testing</h3>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Inspections are performed on-site by authorized human officers utilizing working standard masses and recording live physical seal identifiers.
            </p>
          </div>
          <div className="border-l-2 border-blue-600 pl-3 py-1 space-y-1">
            <h3 className="font-bold text-slate-900">Configurable Rule Engine</h3>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Checklists and Maximum Permissible Error (MPE) thresholds are versioned and evaluated deterministically against recorded observations.
            </p>
          </div>
          <div className="border-l-2 border-blue-600 pl-3 py-1 space-y-1">
            <h3 className="font-bold text-slate-900">Permanent Lifecycle Identity</h3>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Each instrument retains its unique permanent identifier across all applications, verification events, certificates, and renewal cycles.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
