import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Instrument, InstrumentCategory } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Plus, Search, Filter, Cpu, ArrowRight } from 'lucide-react';

export const InstrumentsList: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [categories, setCategories] = useState<InstrumentCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.instruments.getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadInstruments = () => {
    setLoading(true);
    api.instruments.list({
      category_id: selectedCat,
      status_filter: statusFilter || undefined,
      search: searchQuery || undefined
    })
      .then(setInstruments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInstruments();
  }, [selectedCat, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadInstruments();
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      
      {/* Top Registry Header */}
      <div className="bg-white p-4 sm:p-5 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Registered Instruments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage instruments and view their verification lifecycle.
          </p>
        </div>

        <Link
          to="/owner/instruments/new"
          className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Register Instrument
        </Link>
      </div>

      {/* Top Filter and Search Controls */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-2.5">
        <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search instrument / serial / model..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          
          <select
            value={selectedCat || ''}
            onChange={e => setSelectedCat(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:border-blue-600 focus:outline-hidden"
          >
            <option value="">Category ▼</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:border-blue-600 focus:outline-hidden"
          >
            <option value="">Status ▼</option>
            <option value="VERIFIED">Verified</option>
            <option value="REGISTERED">Registered / Pending</option>
            <option value="IN_FIELD_VERIFICATION">In Field Verification</option>
            <option value="EXPIRED">Expired</option>
            <option value="REJECTED">Revoked / Rejected</option>
          </select>
        </div>
      </div>

      {/* Serious Administrative Registry Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading instrument registry records...</div>
        ) : instruments.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Cpu className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No instruments found matching criteria</p>
            <p className="text-[11px] text-slate-400">Register an instrument to initiate digital verification lifecycle.</p>
            <Link
              to="/owner/instruments/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] text-white text-xs font-medium rounded mt-2"
            >
              <Plus className="w-3 h-3" /> Register Instrument
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Instrument ID</th>
                  <th className="py-2.5 px-3">Instrument</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Verification Due</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {instruments.map(inst => (
                  <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-900">
                      {inst.instrument_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{inst.manufacturer} {inst.model}</div>
                      <div className="text-[10px] text-slate-400 font-mono">S/N: {inst.serial_number}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {inst.category_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {inst.owner_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[160px] truncate">
                      {inst.district ? `${inst.district}, ${inst.state}` : inst.installation_address}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={inst.current_status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {inst.valid_until_date ? new Date(inst.valid_until_date).toLocaleDateString('en-IN') : 'Pending Initial'}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        to={`/owner/instruments/${inst.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] transition-colors inline-block border border-slate-200"
                      >
                        Details
                      </Link>
                      <Link
                        to={`/owner/applications/new?instrument_id=${inst.id}`}
                        className="px-2.5 py-1 bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded text-[11px] transition-colors inline-block shadow-2xs"
                      >
                        Apply
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
