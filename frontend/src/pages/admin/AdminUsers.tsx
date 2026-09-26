import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { User, UserRole } from '../../types';
import { Users, Filter } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.users.list(roleFilter ? (roleFilter as UserRole) : undefined)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roleFilter]);

  const roleBadgeMap: Record<string, string> = {
    ADMIN: 'bg-purple-50 text-purple-900 border border-purple-200',
    INSTRUMENT_OWNER: 'bg-blue-50 text-blue-900 border border-blue-200',
    LMO: 'bg-amber-50 text-amber-900 border border-amber-200',
    GATC: 'bg-teal-50 text-teal-900 border border-teal-200',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-md border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Users & Field Personnel</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of registered instrument owners, Legal Metrology Officers, approved test centres, and platform administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:border-[#0B2545] focus:outline-hidden"
          >
            <option value="">All Roles</option>
            <option value="INSTRUMENT_OWNER">Instrument Owners</option>
            <option value="LMO">Legal Metrology Officers (LMO)</option>
            <option value="GATC">GATC Test Specialists</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading user directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">System Role</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Jurisdiction Zone</th>
                  <th className="px-4 py-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${roleBadgeMap[u.role] || 'bg-slate-100'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.designation || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{u.district || 'All Zones'}, {u.state || 'Delhi'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
