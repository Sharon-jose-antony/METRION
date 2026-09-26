import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Certificate } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { ShieldCheck, Download, QrCode, AlertTriangle, ShieldAlert, Filter } from 'lucide-react';

export const AdminCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Revocation Modal
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const loadCertificates = () => {
    setLoading(true);
    api.certificates.list(statusFilter || undefined)
      .then(setCertificates)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCertificates();
  }, [statusFilter]);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCert || !revokeReason.trim()) return;
    setRevoking(true);

    try {
      await api.certificates.revoke(selectedCert.id, revokeReason.trim());
      setSelectedCert(null);
      setRevokeReason('');
      loadCertificates();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-md border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Digital Certificates Archive</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of all issued digital certificates, QR authentication tokens, and validity status tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:border-[#0B2545] focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="VALID">Valid</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading certificates archive...</div>
        ) : certificates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No certificates found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Certificate ID</th>
                  <th className="px-4 py-3">Instrument ID</th>
                  <th className="px-4 py-3">Owner / Establishment</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0B2545]">{cert.certificate_number}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700">{cert.instrument_permanent_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{cert.owner_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{new Date(cert.issue_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{new Date(cert.valid_until_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusBadge status={cert.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/certificates/${cert.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center gap-1 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </a>
                        <Link
                          to={`/verify/${cert.qr_token}`}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded text-[11px] flex items-center gap-1 transition-colors"
                          title="Verify Public QR Page"
                        >
                          <QrCode className="w-3 h-3" /> QR
                        </Link>
                        {cert.status === 'VALID' && (
                          <button
                            onClick={() => setSelectedCert(cert)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Revoke Certificate"
                          >
                            <ShieldAlert className="w-3 h-3" /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revocation Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Revoke Certificate</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedCert.certificate_number}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Revocation will immediately invalidate this digital certificate across all public verification endpoints and QR lookups. This action is recorded in the audit log.
            </p>

            <form onSubmit={handleRevokeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Revocation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={revokeReason}
                  onChange={e => setRevokeReason(e.target.value)}
                  placeholder="e.g. Broken physical security seal detected during inspection; instrument tampered."
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revoking}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {revoking ? 'Revoking...' : 'Confirm Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
