import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Instrument, InstrumentCategory } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Search, Filter, Cpu, ArrowRight } from 'lucide-react';

export const AdminInstruments: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [categories, setCategories] = useState<InstrumentCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.instruments.getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadInstruments = () => {
    setLoading(true);
    api.instruments.list({ category_id: selectedCat, search: searchQuery })
      .then(setInstruments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInstruments();
  }, [selectedCat]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-md border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Registered Instruments Master Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central registry of all weighing and measuring instruments across all registered establishments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCat || ''}
            onChange={e => setSelectedCat(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:border-[#0B2545] focus:outline-hidden"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Instruments Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading instrument registry...</div>
        ) : instruments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No instruments found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Permanent ID</th>
                  <th className="px-4 py-3">Owner / Establishment</th>
                  <th className="px-4 py-3">Make & Model</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verification Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instruments.map(inst => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0B2545]">{inst.instrument_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{inst.owner_name}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 block">{inst.manufacturer}</span>
                      <span className="text-slate-500 text-[11px]">{inst.model}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{inst.serial_number}</td>
                    <td className="px-4 py-3 text-slate-600">{inst.category_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={inst.current_status} /></td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {inst.valid_until_date ? new Date(inst.valid_until_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/owner/instruments/${inst.id}`}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                      >
                        Inspect History →
                      </Link>
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
