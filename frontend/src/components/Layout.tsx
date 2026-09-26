import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  ShieldCheck,
  Building2,
  UserCheck,
  FlaskConical,
  Scale,
  Sparkles,
  ExternalLink,
  Award,
  CheckCircle2
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { isAuthenticated, user, role, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleQuickSwitch = async (email: string, targetPath: string) => {
    try {
      await login(email, 'DemoPass@123');
      navigate(targetPath);
    } catch (err: any) {
      console.error('Role switch failed:', err);
    }
  };

  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/verify');

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. Indian National GovTech Tricolor Accent Bar */}
      <div className="gov-tricolor" />

      {/* 2. Official Ministry & Government Header */}
      <div className="bg-[#0b192c] text-slate-300 text-[11px] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex flex-col md:flex-row items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-center md:text-left">
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
              <span className="text-amber-400 font-serif font-bold text-xs">🇮🇳</span>
              <span>भारत सरकार | Government of India</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">
              उपभोक्ता मामले विभाग • विधिक मापविज्ञान प्रभाग
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-blue-300 font-mono text-[10px] bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800">
              SIH26036
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="text-slate-400">Under Legal Metrology Act, 2009 & General Rules, 2011</span>
            <span className="text-slate-600">•</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE PRODUCTION BUILD
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sticky Quick Role Switcher Bar for Hackathon Judges / Evaluators */}
      <div className="bg-[#1e293b] border-b border-slate-700/80 text-white shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px] shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>SIH Evaluator Quick Access:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleRoleQuickSwitch('owner@demo.legalmet.local', '/owner/dashboard')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                role === 'INSTRUMENT_OWNER'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
              }`}
              title="Trader / Instrument Owner (Sanjay Gupta - 5 Verified Instruments)"
            >
              <Building2 className="w-3 h-3 text-blue-400" />
              <span>Trader / Owner</span>
            </button>

            <button
              onClick={() => handleRoleQuickSwitch('lmo@demo.legalmet.local', '/lmo/dashboard')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                role === 'LMO'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
              }`}
              title="Field Verification Officer (Inspector Vikram Malhotra - On-site testing & Stamping)"
            >
              <UserCheck className="w-3 h-3 text-amber-400" />
              <span>LMO Officer</span>
            </button>

            <button
              onClick={() => handleRoleQuickSwitch('gatc@demo.legalmet.local', '/gatc/dashboard')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                role === 'GATC'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
              }`}
              title="Govt Approved Test Centre (Dr. Ananya Ray - National Calibration Lab)"
            >
              <FlaskConical className="w-3 h-3 text-teal-400" />
              <span>GATC Test Lab</span>
            </button>

            <button
              onClick={() => handleRoleQuickSwitch('admin@demo.legalmet.local', '/admin/dashboard')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                role === 'ADMIN'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
              }`}
              title="State Administrator (Rajesh Sharma - Scrutiny, Scheduling & Oversight)"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>State Admin</span>
            </button>

            <button
              onClick={() => navigate('/verify/a1b2c3d4e5f67890abcdef1234567890')}
              className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Consumer / Citizen QR Scanner Verification"
            >
              <QrCode className="w-3 h-3 text-emerald-400" />
              <span>Public QR Scanner</span>
            </button>
          </div>
        </div>
      </div>

      <Navbar />

      <div className="flex-1 flex w-full">
        {isAuthenticated && !isPublicPage && <Sidebar />}

        <main className={`flex-1 p-3 sm:p-5 lg:p-6 w-full overflow-y-auto ${!isAuthenticated || isPublicPage ? 'max-w-7xl mx-auto' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Clean Professional GovTech Footer */}
      <footer className="bg-white text-slate-600 border-t border-slate-200 text-xs mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <span className="font-bold text-sm text-slate-900 tracking-tight">METRION</span>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-semibold">
                  SIH26036 Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                National Digital Verification, Certificate Lifecycle & Compliance Platform for Weighing and Measuring Instruments. Eliminating manual friction, physical stamps, and siloed jurisdictions through cryptographic QR verification and tamper-proof verification history.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                <span>The Legal Metrology Act, 2009</span>
                <span>•</span>
                <span>The Legal Metrology (General) Rules, 2011</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Statutory Modules
              </span>
              <ul className="space-y-1 text-xs">
                <li>
                  <Link to="/verify/a1b2c3d4e5f67890abcdef1234567890" className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Public QR Authentication</span>
                  </Link>
                </li>
                <li>
                  <button onClick={() => handleRoleQuickSwitch('owner@demo.legalmet.local', '/owner/dashboard')} className="text-slate-600 hover:text-blue-600 transition-colors text-left">
                    Instrument Registration & Lodgement
                  </button>
                </li>
                <li>
                  <button onClick={() => handleRoleQuickSwitch('lmo@demo.legalmet.local', '/lmo/dashboard')} className="text-slate-600 hover:text-blue-600 transition-colors text-left">
                    Field Officer Checklist Roster
                  </button>
                </li>
                <li>
                  <button onClick={() => handleRoleQuickSwitch('admin@demo.legalmet.local', '/admin/dashboard')} className="text-slate-600 hover:text-blue-600 transition-colors text-left">
                    Administrative Scrutiny & Audit Logs
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Deployment Architecture
              </span>
              <div className="space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Backend API:</span>
                  <a href="https://metrion.onrender.com/docs" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono">
                    Render FastAPI ↗
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frontend CDN:</span>
                  <span className="font-mono text-slate-700">GitHub Pages / Vercel</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Security Standard:</span>
                  <span className="font-mono text-slate-700">SHA-256 Vector QR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Statutory Certificate:</span>
                  <span className="font-mono text-emerald-700 font-semibold">Form VII PDF</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              © 2026 METRION Platform • Developed for Smart India Hackathon (SIH26036).
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Official Demo Configuration
              </span>
              <span>•</span>
              <a href="https://github.com/Sharon-jose-antony/METRION" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-mono">
                GitHub Repository <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
