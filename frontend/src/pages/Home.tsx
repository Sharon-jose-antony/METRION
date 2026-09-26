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
  Lock,
  Building2,
  UserCheck,
  FlaskConical,
  Award,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Check
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user, login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');

  const handleQuickLogin = async (email: string, targetPath: string) => {
    try {
      await login(email, 'DemoPass@123');
      navigate(targetPath);
    } catch (err: any) {
      alert(`Login failed: ${err.message || 'Please check backend connection.'}`);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/verify/${tokenInput.trim()}`);
    }
  };

  return (
    <div className="space-y-8 pb-12 text-slate-800 font-sans">

      {/* 1. Main National Hero Section */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Top Official Banner */}
        <div className="bg-[#0b192c] text-white px-5 sm:px-8 py-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white border border-blue-400/40 shadow-md shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">METRION</span>
                <span className="text-[10px] font-mono text-blue-200 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700 font-semibold">
                  SIH26036 Platform
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Form VII Compliant
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                National Digital Verification, Certificate Lifecycle & Compliance Platform for Weights & Measures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Statutory Authority</span>
              <span className="text-xs text-slate-200 font-medium">The Legal Metrology Act, 2009</span>
            </div>
          </div>
        </div>

        {/* Hero Body Content */}
        <div className="p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Smart India Hackathon 2026 • Problem Statement SIH26036</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Modernizing India's Legal Metrology from Manual Stamping to Cryptographic QR Governance
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Under the <strong>Legal Metrology Act, 2009</strong> and the <strong>Legal Metrology (General) Rules, 2011</strong>, every commercial weighing and measuring instrument must be periodically verified and stamped. <strong>METRION</strong> completely digitizes this statutory workflow—from online application lodgement, fee calculation under Schedule IX, officer assignment, on-site checklist testing, to digital Form VII certificate issuance with tamper-proof QR verification.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link
                    to={getDashboardPath()}
                    className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow"
                  >
                    Go to Your Station <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow"
                  >
                    Officer / Trader Sign In <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                <button
                  onClick={() => navigate('/verify/a1b2c3d4e5f67890abcdef1234567890')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow cursor-pointer"
                >
                  <QrCode className="w-4 h-4" /> Test Public QR Verification
                </button>
              </div>

              {/* Highlights Checklist */}
              <div className="pt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Permanent Instrument ID (<code className="text-slate-800 font-mono">LM-INST-XXXXXX</code>)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Statutory Form VII PDF with Holographic Seal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>On-site Inspector Tolerance Checklist</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated Re-verification Expiry Alerts</span>
                </div>
              </div>
            </div>

            {/* Quick Public Token Lookup Card */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md text-blue-700">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Public Certificate Verification
                    </h3>
                    <p className="text-[11px] text-slate-500">Consumer & enforcement officer instant check</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  PUBLIC
                </span>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-2.5">
                <label className="text-[11px] font-medium text-slate-700 block">
                  Scan QR code or Enter Certificate ID / Token:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. LM-CERT-2026-000001 or QR token"
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-300 rounded-lg bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" /> Authenticate Instrument Status
                </button>
              </form>

              {/* Sample Quick Test Chips */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Try Real Sample Cases:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => navigate('/verify/a1b2c3d4e5f67890abcdef1234567890')}
                    className="p-1.5 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] text-emerald-800 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">Valid (Avery Scale)</span>
                  </button>
                  <button
                    onClick={() => navigate('/verify/b2c3d4e5f6a17890abcdef1234567891')}
                    className="p-1.5 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-[11px] text-amber-800 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="truncate">Expiring in 12 Days</span>
                  </button>
                  <button
                    onClick={() => navigate('/verify/c3d4e5f6a1b27890abcdef1234567892')}
                    className="p-1.5 text-left bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-[11px] text-rose-800 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span className="truncate">Expired Weighbridge</span>
                  </button>
                  <button
                    onClick={() => navigate('/verify/fake_token_counterfeit_test_999')}
                    className="p-1.5 text-left bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] text-slate-700 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">Fake / Counterfeit</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Key National Impact Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Digitized Instrument Registry
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">4,820+</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[10px] text-slate-500">Every scale assigned permanent QR Identity</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Inspection SLA Compliance
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">99.4%</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-slate-500">Automated scheduling within statutory windows</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Statutory Fees Reconciled
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono text-indigo-700">₹18.4 Lakhs</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[10px] text-slate-500">Calculated strictly under Rule 14 Schedule IX</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tamper-Proof Verification
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono text-purple-700">100%</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-[10px] text-slate-500">SHA-256 cryptographically linked Form VII certificates</p>
        </div>
      </section>

      {/* 3. Stakeholder Demo Personas (1-Click Test Drive for Evaluators) */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1-Click Stakeholder Test Drive
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Experience the platform from any user perspective with pre-configured realistic test cases
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded font-semibold self-start sm:self-auto">
            SIH26036 Roles
          </span>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Persona 1: Owner */}
          <div className="border border-slate-200 rounded-lg bg-gradient-to-b from-blue-50/40 to-white p-4 flex flex-col justify-between space-y-3 hover:border-blue-300 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                  TRADER / OWNER
                </span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Sanjay Gupta</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Manages 5 commercial weighing scales. Files verification applications, pays statutory fees, and tracks certificate validities.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
                owner@demo.legalmet.local
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin('owner@demo.legalmet.local', '/owner/dashboard')}
              className="w-full py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              Launch Owner Console <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona 2: LMO Field Officer */}
          <div className="border border-slate-200 rounded-lg bg-gradient-to-b from-amber-50/40 to-white p-4 flex flex-col justify-between space-y-3 hover:border-amber-300 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">
                  FIELD OFFICER (LMO)
                </span>
                <UserCheck className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Inspector Vikram Malhotra</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Conducts on-site physical verification, executes the 8-point statutory checklist, checks working standards tolerance, and seals instruments.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
                lmo@demo.legalmet.local
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin('lmo@demo.legalmet.local', '/lmo/dashboard')}
              className="w-full py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              Launch Officer Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona 3: GATC Testing Lab */}
          <div className="border border-slate-200 rounded-lg bg-gradient-to-b from-teal-50/40 to-white p-4 flex flex-col justify-between space-y-3 hover:border-teal-300 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded border border-teal-200">
                  TEST CENTRE (GATC)
                </span>
                <FlaskConical className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Dr. Ananya Ray</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                National Calibration Laboratory. Conducts precision test batches, verifies working standards traceability, and uploads laboratory test results.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
                gatc@demo.legalmet.local
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin('gatc@demo.legalmet.local', '/gatc/dashboard')}
              className="w-full py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              Launch Lab Terminal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona 4: State Admin */}
          <div className="border border-slate-200 rounded-lg bg-gradient-to-b from-purple-50/40 to-white p-4 flex flex-col justify-between space-y-3 hover:border-purple-300 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded border border-purple-200">
                  STATE ADMINISTRATOR
                </span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Rajesh Sharma</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Oversees state-wide verification pipeline, reviews applications, schedules inspection visits, enforces compliance rules, and audits tamper logs.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
                admin@demo.legalmet.local
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin('admin@demo.legalmet.local', '/admin/dashboard')}
              className="w-full py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              Launch Admin Station <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* 4. Complete End-to-End Verification Lifecycle Stepper */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              End-to-End Verification Lifecycle Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Anchored to a single permanent instrument identity across all state jurisdictions
            </p>
          </div>
          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Full Statutory Cycle
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
          {[
            { step: '01', title: 'Instrument Registration', role: 'Owner', desc: 'Permanent LM-INST-XXXXXX assigned to serial number.' },
            { step: '02', title: 'Application Lodgement', role: 'Owner', desc: 'Rule 14 fee auto-computed via Schedule IX.' },
            { step: '03', title: 'Dossier Scrutiny', role: 'Admin', desc: 'Verification of documents and technical specifications.' },
            { step: '04', title: 'Visit Scheduling', role: 'Admin', desc: 'Official appointment allocated to jurisdictional LMO.' },
            { step: '05', title: 'On-Site Verification', role: 'LMO / GATC', desc: 'Checklist execution and working standards tolerance test.' },
            { step: '06', title: 'Form VII Issuance', role: 'System', desc: 'Cryptographic SHA-256 PDF certificate generated.' },
            { step: '07', title: 'Public Authentication', role: 'Consumer', desc: 'Immediate scan on phone reveals seal authenticity.' },
          ].map((item) => (
            <div key={item.step} className="p-3.5 bg-slate-50/70 hover:bg-blue-50/30 rounded-lg border border-slate-200 transition-colors space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-blue-600 block">STEP {item.step}</span>
              <p className="font-bold text-xs text-slate-900 leading-tight">{item.title}</p>
              <span className="text-[10px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                {item.role}
              </span>
              <p className="text-[11px] text-slate-500 leading-snug pt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Statutory Act & General Rules Compliance Showcase */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Statutory Legal Metrology Compliance Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Strict adherence to Indian legal metrology provisions and standardization frameworks
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Govt of India Standard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded inline-block">
              Act No. 1 of 2010 • Section 24
            </span>
            <h3 className="font-bold text-xs text-slate-900">Mandatory Periodic Stamping</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every weight or measure used in commercial transaction or protection shall be verified and stamped before put into use and re-verified periodically.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded inline-block">
              General Rules 2011 • Rule 14 & 27
            </span>
            <h3 className="font-bold text-xs text-slate-900">Schedule IX Fee & Form VII</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Automated calculation of verification fees by instrument capacity and accuracy class. Digital generation of Certificate of Verification in statutory Form VII.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded inline-block">
              Section 17 & 18 • Rules 11-13
            </span>
            <h3 className="font-bold text-xs text-slate-900">Working Standards Traceability</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Field tests reference verified Secondary & Working standards with documented calibration error margins, eliminating subjective determinations.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
