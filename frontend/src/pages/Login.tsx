import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Cpu,
  FileCheck2,
  CalendarDays,
  CheckCircle2,
  QrCode,
  RefreshCw,
  UserCheck,
  Building2
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email.trim(), password);
      navigate(getDashboardPath(user.role));
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = (roleEmail: string, personaKey: string) => {
    setEmail(roleEmail);
    setPassword('DemoPass@123');
    setSelectedPersona(personaKey);
    setError(null);
  };

  const lifecycleSteps = [
    { label: 'REGISTER', desc: 'Permanent Instrument Identity', icon: <Cpu className="w-3.5 h-3.5 text-blue-600" /> },
    { label: 'APPLY', desc: 'Initial & Re-verification Filing', icon: <FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> },
    { label: 'SCHEDULE', desc: 'Slot & Officer Assignment', icon: <CalendarDays className="w-3.5 h-3.5 text-blue-600" /> },
    { label: 'VERIFY', desc: 'Checklist & Tolerance Tests', icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> },
    { label: 'CERTIFY', desc: 'Form VII Digital Certificate', icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> },
    { label: 'AUTHENTICATE', desc: 'Public QR Status Lookup', icon: <QrCode className="w-3.5 h-3.5 text-blue-600" /> },
    { label: 'RE-VERIFY', desc: 'Continuous Traceable Cycle', icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4 sm:px-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Left Column: Product Identity & Lifecycle Visualization */}
        <div className="md:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white border border-blue-400 shadow-2xs">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wider block">METRION</span>
                <span className="text-[10px] text-slate-400 font-mono">SIH26036</span>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Digital Verification & Certificate Lifecycle Platform
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Digitizing the verification lifecycle of weighing and measuring instruments.
              </p>
            </div>

            {/* Lifecycle Flow */}
            <div className="pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Verification Lifecycle Protocol
              </p>

              <div className="space-y-2 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-700">
                {lifecycleSteps.map((step, idx) => (
                  <div key={step.label} className="relative flex items-center gap-2.5 pl-6 group">
                    <div className="absolute left-[7px] w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center group-hover:border-blue-400 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-300 tracking-wider">
                        {step.label}
                      </span>
                      <span className="text-[11px] text-slate-400 block -mt-0.5">
                        {step.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-6 text-[10px] text-slate-500 font-mono">
            Prototype Environment • SIH 2026
          </div>
        </div>

        {/* Right Column: Sign In Form & Demo Personas */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Sign In
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Access the METRION verification platform.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="pl-8.5 w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-8.5 w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-[#0f172a] hover:bg-slate-800 text-white font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Selectable Demo Persona Cards */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Demo Access
                </span>
                <span className="text-[10px] text-slate-400">Click to prefill credentials</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPersona('owner@demo.legalmet.local', 'OWNER')}
                  className={`p-2.5 text-left rounded border transition-colors cursor-pointer ${
                    selectedPersona === 'OWNER'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-blue-700 uppercase block">OWNER</span>
                  <span className="text-xs font-semibold text-slate-900 block mt-0.5">Instrument Owner</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">owner@demo.legalmet.local</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPersona('admin@demo.legalmet.local', 'ADMIN')}
                  className={`p-2.5 text-left rounded border transition-colors cursor-pointer ${
                    selectedPersona === 'ADMIN'
                      ? 'border-purple-600 bg-purple-50/60 ring-1 ring-purple-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-purple-700 uppercase block">ADMIN</span>
                  <span className="text-xs font-semibold text-slate-900 block mt-0.5">Administrator</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">admin@demo.legalmet.local</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPersona('lmo@demo.legalmet.local', 'LMO')}
                  className={`p-2.5 text-left rounded border transition-colors cursor-pointer ${
                    selectedPersona === 'LMO'
                      ? 'border-amber-600 bg-amber-50/60 ring-1 ring-amber-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-amber-700 uppercase block">LMO</span>
                  <span className="text-xs font-semibold text-slate-900 block mt-0.5">Field Officer</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">lmo@demo.legalmet.local</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPersona('gatc@demo.legalmet.local', 'GATC')}
                  className={`p-2.5 text-left rounded border transition-colors cursor-pointer ${
                    selectedPersona === 'GATC'
                      ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-teal-700 uppercase block">GATC</span>
                  <span className="text-xs font-semibold text-slate-900 block mt-0.5">Test Centre</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">gatc@demo.legalmet.local</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Commercial Instrument Owner?</span>
            <Link to="/register" className="font-semibold text-blue-600 hover:underline">
              Register Profile
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
