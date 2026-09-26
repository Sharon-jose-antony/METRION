import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Scale, SlidersHorizontal, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';

export const AdminRules: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.rules.list(),
      api.rules.getCurrentVersion()
    ])
      .then(([rulesList, curVer]) => {
        setRules(rulesList);
        setChecklists(curVer.checklists || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
          DETERMINISTIC VERIFICATION ENGINE
        </span>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Verification Rules & Checklists</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Structured inspection checklists with numerical Maximum Permissible Error (MPE) thresholds. The system stores the checklist version applied during each field inspection.
        </p>
      </div>

      {/* Rules Registry Table (Section 19 Requirements) */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Registered Verification Rule Protocols
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-2.5">Instrument Category</th>
                <th className="px-4 py-2.5">Jurisdiction</th>
                <th className="px-4 py-2.5">Rule Reference</th>
                <th className="px-4 py-2.5">Version</th>
                <th className="px-4 py-2.5">Effective From</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">Non-Automatic Weighing Instruments (NAWI)</td>
                <td className="px-4 py-3 text-slate-600">Demo Configuration</td>
                <td className="px-4 py-3 font-mono text-slate-600">LM-RULE-NAWI-01</td>
                <td className="px-4 py-3 font-mono font-bold text-[#0B2545]">Checklist v1.0</td>
                <td className="px-4 py-3 text-slate-600">2026-01-01</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">Weighbridges & Industrial Heavy Platforms</td>
                <td className="px-4 py-3 text-slate-600">Demo Configuration</td>
                <td className="px-4 py-3 font-mono text-slate-600">LM-RULE-WB-02</td>
                <td className="px-4 py-3 font-mono font-bold text-[#0B2545]">Checklist v1.0</td>
                <td className="px-4 py-3 text-slate-600">2026-01-01</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">Fuel Dispensers & Flow Meters</td>
                <td className="px-4 py-3 text-slate-600">Demo Configuration</td>
                <td className="px-4 py-3 font-mono text-slate-600">LM-RULE-FD-03</td>
                <td className="px-4 py-3 font-mono font-bold text-[#0B2545]">Checklist v1.0</td>
                <td className="px-4 py-3 text-slate-600">2026-01-01</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Checklist Test Items Detail */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-md border border-slate-200">Loading checklist items...</div>
      ) : (
        <div className="space-y-4">
          {checklists.map((chk: any) => (
            <div key={chk.id} className="bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#0B2545]" />
                    <h3 className="font-bold text-sm text-slate-900">{chk.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{chk.description}</p>
                </div>
                <span className="text-xs font-mono font-semibold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                  {chk.items.length} Verification Checks
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {chk.items.map((item: any, idx: number) => (
                  <div key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-semibold">#{idx + 1} [{item.code}]</span>
                        {item.required && <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded uppercase">Required</span>}
                      </div>
                      <p className="font-semibold text-slate-800 mt-0.5">{item.label}</p>
                      {item.help_text && <p className="text-[11px] text-slate-500">{item.help_text}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {item.field_type} {item.unit ? `(${item.unit})` : ''}
                      </span>
                      {item.min_value !== null && item.max_value !== null && (
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          Tolerance: [{item.min_value} to {item.max_value} {item.unit}]
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
