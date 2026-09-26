import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { NotificationItem, UserRole } from '../types';
import {
  ShieldCheck,
  QrCode,
  Bell,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Search,
  CheckCircle2
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout, login, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState('');

  const demoMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api.notifications.list()
        .then(setNotifications)
        .catch(() => {});
    }
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target as Node)) {
        setShowDemoMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRoleSwitch = async (email: string) => {
    try {
      await login(email, 'DemoPass@123');
      setShowDemoMenu(false);
      setTimeout(() => {
        if (email.includes('admin')) navigate('/admin/dashboard');
        else if (email.includes('owner')) navigate('/owner/dashboard');
        else if (email.includes('lmo')) navigate('/lmo/dashboard');
        else if (email.includes('gatc')) navigate('/gatc/dashboard');
      }, 50);
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    }
  };

  const handleQrLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrTokenInput.trim()) {
      setShowQrModal(false);
      navigate(`/verify/${qrTokenInput.trim()}`);
    }
  };

  const roleNameMap: Record<UserRole, { label: string; badgeColor: string }> = {
    ADMIN: { label: 'Administrator', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300' },
    INSTRUMENT_OWNER: { label: 'Instrument Owner', badgeColor: 'bg-blue-50 text-blue-800 border-blue-200' },
    LMO: { label: 'Field Officer (LMO)', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
    GATC: { label: 'Test Centre (GATC)', badgeColor: 'bg-teal-50 text-teal-800 border-teal-200' },
  };

  return (
    <>
      <header className="bg-[#0f172a] text-white sticky top-0 z-40 border-b border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            
            {/* Logo / Branding */}
            <div className="flex items-center gap-3">
              <Link to={user ? getDashboardPath() : '/'} className="flex items-center gap-2.5 group">
                <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white border border-blue-500 shadow-2xs">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 leading-none">
                    <span className="font-bold text-sm tracking-wide text-white">METRION</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 hidden sm:inline-block">
                      SIH26036
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5 hidden sm:block">
                    Digital Verification & Certificate Lifecycle Platform
                  </p>
                </div>
              </Link>
            </div>

            {/* Middle: Verify Certificate QR button */}
            <div className="hidden md:flex items-center">
              <button
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Verify Certificate</span>
              </button>
            </div>

            {/* Right: Controls & Profile */}
            <div className="flex items-center gap-2.5">
              
              {/* Subtle Demo Persona Switcher */}
              <div className="relative" ref={demoMenuRef}>
                <button
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 transition-colors cursor-pointer"
                  title="Switch demo persona"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-mono text-[11px] font-semibold">DEMO</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showDemoMenu && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded border border-slate-200 shadow-lg py-1 z-50 text-slate-800">
                    <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Demo Persona Switcher</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Select a role to test persona workflows</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <button
                        onClick={() => handleRoleSwitch('owner@demo.legalmet.local')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">Instrument Owner</p>
                          <p className="text-[10px] text-slate-500 font-mono">owner@demo.legalmet.local</p>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-medium">Owner</span>
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('admin@demo.legalmet.local')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">Administrator</p>
                          <p className="text-[10px] text-slate-500 font-mono">admin@demo.legalmet.local</p>
                        </div>
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">Admin</span>
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('lmo@demo.legalmet.local')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">Field Officer (LMO)</p>
                          <p className="text-[10px] text-slate-500 font-mono">lmo@demo.legalmet.local</p>
                        </div>
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-medium">LMO</span>
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('gatc@demo.legalmet.local')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">Test Centre (GATC)</p>
                          <p className="text-[10px] text-slate-500 font-mono">gatc@demo.legalmet.local</p>
                        </div>
                        <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200 font-medium">GATC</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              {user && (
                <div className="relative" ref={notifMenuRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 bg-rose-500 text-[9px] font-bold rounded-full flex items-center justify-center text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-1.5 w-80 bg-white rounded border border-slate-200 shadow-lg py-1 z-50 text-slate-800">
                      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Notifications ({unreadCount})</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => {
                              api.notifications.markAllRead();
                              setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                            }}
                            className="text-[11px] text-blue-600 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center italic">No new notifications</p>
                        ) : (
                          notifications.slice(0, 8).map(n => (
                            <div
                              key={n.id}
                              className={`p-3 text-xs hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                            >
                              <p className="font-semibold text-slate-900">{n.title}</p>
                              <p className="text-slate-600 mt-0.5 text-[11px]">{n.message}</p>
                              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Profile / Auth State */}
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-medium text-slate-200 leading-tight">{user.full_name}</p>
                    <span className="text-[10px] text-slate-400">
                      {role ? roleNameMap[role].label : ''}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-semibold px-3 py-1.5 rounded text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* QR Code Lookup Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Verify Certificate QR
                </h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter the 32-character certificate QR token to query live verification status:
            </p>

            <form onSubmit={handleQrLookup} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. 7ad974d6f45a4f479a95786720f491c6"
                value={qrTokenInput}
                onChange={e => setQrTokenInput(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Authenticate Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
