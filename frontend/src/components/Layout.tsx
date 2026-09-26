import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { QrCode, ShieldCheck } from 'lucide-react';

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans antialiased">
      
      {/* Subtle Environment Indicator Banner */}
      <div className="bg-[#0f172a] text-slate-400 text-[11px] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span className="font-semibold text-slate-200">METRION</span>
            <span className="text-slate-600">•</span>
            <span>Digital Verification & Certificate Lifecycle Platform</span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-300 font-mono text-[10px]">SIH26036</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              PROTOTYPE ENVIRONMENT
            </span>
            <span className="text-slate-600">•</span>
            <span>DEMO MODE</span>
          </div>
        </div>
      </div>

      <Navbar />

      <div className="flex-1 flex w-full">
        {isAuthenticated && <Sidebar />}

        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Clean Professional Footer */}
      <footer className="bg-white text-slate-500 border-t border-slate-200 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">METRION</span>
              <span className="text-slate-400">|</span>
              <span>Digital Verification & Certificate Lifecycle Platform</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-slate-400 text-[10px]">SIH 2026 Prototype</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/verify/7ad974d6f45a4f479a95786720f491c6" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
                <QrCode className="w-3.5 h-3.5 text-blue-500" />
                <span>Certificate Verification</span>
              </Link>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[10px] text-slate-400">SIH26036</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
