import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle2, AlertCircle, Clock, X, Bike, MapPin } from 'lucide-react';
import api from '../../services/api';
import { Maintenance, Bicycle } from '../../types';

export const AdminMaintenancePage: React.FC = () => {
  const [tickets, setTickets] = useState<Maintenance[]>([]);
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [loading, setLoading] = useState(true);

  // New ticket modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update modal
  const [updateModalTicket, setUpdateModalTicket] = useState<Maintenance | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchTicketsAndBikes = async () => {
    setLoading(true);
    try {
      const [ticketsRes, bikesRes] = await Promise.all([
        api.get('/admin/maintenance'),
        api.get('/admin/bicycles')
      ]);
      setTickets(ticketsRes.data.maintenance || []);
      setBicycles(bikesRes.data.bicycles || []);
      if (bikesRes.data.bicycles?.length > 0) {
        setSelectedBikeId(bikesRes.data.bicycles[0].id);
      }
    } catch (err) {
      console.error('Error fetching maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsAndBikes();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.post('/admin/maintenance', {
        bicycleId: selectedBikeId,
        description
      });
      if (res.data.success) {
        setNewModalOpen(false);
        setDescription('');
        fetchTicketsAndBikes();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModalTicket) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch(`/admin/maintenance/${updateModalTicket.id}`, {
        status: updateStatus,
        resolutionNotes: resolutionNotes || undefined
      });
      if (res.data.success) {
        setUpdateModalTicket(null);
        setResolutionNotes('');
        fetchTicketsAndBikes();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Maintenance Depot</h1>
          <p className="text-sm text-slate-500 mt-0.5">Report mechanical defects, schedule repairs, and return bicycles to service</p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-campus-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report Bicycle Defect</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campus-600 mx-auto mb-2"></div>
            Loading maintenance log...
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    t.status === 'RESOLVED' 
                      ? 'bg-campus-50 text-campus-700' 
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {t.bicycle?.bicycleCode || 'Bicycle'}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        t.status === 'RESOLVED'
                          ? 'bg-campus-50 text-campus-700 border border-campus-200'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{t.description}</p>
                    {t.resolutionNotes && (
                      <p className="text-xs text-slate-500 italic">Resolution: {t.resolutionNotes}</p>
                    )}
                    <div className="text-[11px] text-slate-400">
                      Reported: {new Date(t.reportedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      {t.resolvedAt && ` • Resolved: ${new Date(t.resolvedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  {t.status !== 'RESOLVED' && (
                    <button
                      onClick={() => {
                        setUpdateModalTicket(t);
                        setUpdateStatus(t.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Update Status</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-400">
            All campus bicycles are currently operational. No open defect tickets.
          </div>
        )}
      </div>

      {/* Log Damage Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Schedule Repair / Log Defect</h3>
              <button onClick={() => setNewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Select Bicycle
                </label>
                <select
                  value={selectedBikeId}
                  onChange={(e) => setSelectedBikeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-500 bg-white"
                >
                  {bicycles.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bicycleCode} — {b.model} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Defect Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Front chain slipping, rear tire puncture identified at Library stand..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-500"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || description.trim().length < 5}
                  className="flex-1 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold shadow-md shadow-campus-600/20 disabled:opacity-50"
                >
                  {saving ? 'Logging...' : 'Mark Under Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Maintenance Ticket Modal */}
      {updateModalTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Update Ticket: {updateModalTicket.bicycle?.bicycleCode}
              </h3>
              <button onClick={() => setUpdateModalTicket(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Update Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-500 bg-white"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS (Currently being repaired)</option>
                  <option value="RESOLVED">RESOLVED (Restores bicycle to AVAILABLE fleet)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Resolution Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Replaced inner tube and realigned derailleur. Tested safe for campus riding."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-500"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setUpdateModalTicket(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold shadow-md shadow-campus-600/20 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
