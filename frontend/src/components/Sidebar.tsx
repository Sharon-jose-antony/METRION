import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Cpu,
  FileCheck2,
  CalendarDays,
  ShieldCheck,
  ClipboardList,
  Users,
  ScrollText,
  Plus,
  QrCode,
  Bell,
  SlidersHorizontal
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  if (!role) return null;

  interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const sections: NavSection[] = [];

  if (role === 'ADMIN') {
    sections.push({
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'INSTRUMENTS',
      items: [
        { label: 'Registered Instruments', path: '/admin/instruments', icon: <Cpu className="w-3.5 h-3.5" /> },
        { label: 'Register Instrument', path: '/owner/instruments/new', icon: <Plus className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'VERIFICATION',
      items: [
        { label: 'Applications Queue', path: '/admin/applications', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
        { label: 'Rules & Checklists', path: '/admin/rules', icon: <ClipboardList className="w-3.5 h-3.5" /> },
        { label: 'Officers & GATCs', path: '/admin/users', icon: <Users className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'CERTIFICATES',
      items: [
        { label: 'Digital Certificates', path: '/admin/certificates', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
        { label: 'Verify Certificate', path: '/verify/a1b2c3d4e5f67890abcdef1234567890', icon: <QrCode className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'SYSTEM',
      items: [
        { label: 'Audit Log', path: '/admin/audit', icon: <ScrollText className="w-3.5 h-3.5" /> }
      ]
    });
  } else if (role === 'INSTRUMENT_OWNER') {
    sections.push({
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/owner/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'INSTRUMENTS',
      items: [
        { label: 'Registered Instruments', path: '/owner/instruments', icon: <Cpu className="w-3.5 h-3.5" /> },
        { label: 'Register Instrument', path: '/owner/instruments/new', icon: <Plus className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'VERIFICATION',
      items: [
        { label: 'Applications', path: '/owner/applications', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
        { label: 'New Application', path: '/owner/applications/new', icon: <Plus className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'CERTIFICATES',
      items: [
        { label: 'Digital Certificates', path: '/owner/certificates', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
        { label: 'Verify Certificate', path: '/verify/a1b2c3d4e5f67890abcdef1234567890', icon: <QrCode className="w-3.5 h-3.5" /> }
      ]
    });
  } else if (role === 'LMO') {
    sections.push({
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/lmo/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'VERIFICATION',
      items: [
        { label: 'Assigned Field Cases', path: '/lmo/assignments', icon: <CalendarDays className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'CERTIFICATES',
      items: [
        { label: 'Verify Certificate', path: '/verify/a1b2c3d4e5f67890abcdef1234567890', icon: <QrCode className="w-3.5 h-3.5" /> }
      ]
    });
  } else if (role === 'GATC') {
    sections.push({
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/gatc/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'VERIFICATION',
      items: [
        { label: 'Calibration Assignments', path: '/gatc/assignments', icon: <CalendarDays className="w-3.5 h-3.5" /> }
      ]
    });
    sections.push({
      title: 'CERTIFICATES',
      items: [
        { label: 'Verify Certificate', path: '/verify/a1b2c3d4e5f67890abcdef1234567890', icon: <QrCode className="w-3.5 h-3.5" /> }
      ]
    });
  }

  return (
    <aside className="w-56 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col min-h-[calc(100vh-3.5rem)] text-xs">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Navigation</span>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{role}</span>
      </div>

      <nav className="p-2 space-y-4 flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 tracking-wider">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 text-xs transition-colors rounded ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-900 font-semibold border-l-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-2 border-transparent'
                  }`
                }
              >
                <span className="text-slate-500">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Prototype Environment Tag */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>SIH26036 Prototype</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
          Demo Environment
        </p>
      </div>
    </aside>
  );
};
