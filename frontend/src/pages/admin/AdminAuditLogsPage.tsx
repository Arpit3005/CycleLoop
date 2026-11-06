import React, { useState, useEffect } from 'react';
import { FileText, ShieldAlert, Calendar, User, Eye, X } from 'lucide-react';
import api from '../../services/api';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMeta, setSelectedMeta] = useState<{ title: string; data: any } | null>(null);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${p}&limit=15`);
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.totalPages || 1);
        setPage(p);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Audit Compliance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Immutable record of all administrative overrides, pricing revisions, and fleet state mutations</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campus-600 mx-auto mb-2"></div>
            Loading audit records...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.actorId}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{log.actorType}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                      {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })},{' '}
                      {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {log.metadata ? (
                        <button
                          onClick={() => {
                            let parsed = log.metadata;
                            try {
                              parsed = JSON.parse(log.metadata);
                            } catch (e) {}
                            setSelectedMeta({
                              title: `${log.action} — ${log.entityType}`,
                              data: parsed
                            });
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-400">
            No audit events recorded.
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <button
              disabled={page <= 1}
              onClick={() => fetchLogs(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchLogs(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedMeta && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 font-mono truncate">{selectedMeta.title}</h3>
              <button onClick={() => setSelectedMeta(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-80">
              <pre>{JSON.stringify(selectedMeta.data, null, 2)}</pre>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedMeta(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
