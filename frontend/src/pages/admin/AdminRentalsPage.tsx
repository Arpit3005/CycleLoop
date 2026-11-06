import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Clock, 
  Calendar, 
  IndianRupee, 
  Bike, 
  AlertTriangle, 
  ShieldAlert, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { Rental, RentalStatus } from '../../types';

export const AdminRentalsPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Override modal
  const [overrideModalRental, setOverrideModalRental] = useState<Rental | null>(null);
  const [overrideAction, setOverrideAction] = useState<'FORCE_RETURN' | 'CANCEL'>('FORCE_RETURN');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const fetchRentals = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(p));
      params.append('limit', '10');
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/admin/rentals?${params.toString()}`);
      setRentals(res.data.rentals || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.error('Error fetching rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRentals(1);
  };

  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalRental) return;
    setSubmittingOverride(true);
    setOverrideError(null);

    try {
      const res = await api.post(`/admin/rentals/${overrideModalRental.id}/override`, {
        action: overrideAction,
        notes: overrideNotes
      });

      if (res.data.success) {
        setOverrideModalRental(null);
        setOverrideNotes('');
        fetchRentals(page);
      }
    } catch (err: any) {
      setOverrideError(err.response?.data?.message || 'Failed to execute rental override.');
    } finally {
      setSubmittingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rental Sessions & Live Trips</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track all bicycle checkouts, returns, duration metrics, and exceptional overrides</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, roll no, bike code..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-campus-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st || 'All Sessions'}
            </button>
          ))}
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campus-600 mx-auto mb-2"></div>
            Loading rentals...
          </div>
        ) : rentals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Bicycle</th>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Start Time</th>
                  <th className="px-5 py-3.5">End Time</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Rate & Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rentals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {r.bicycleCode}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{r.student?.name || 'Student'}</div>
                      <div className="text-xs text-slate-500 font-mono">{r.student?.rollNo}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(r.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {r.endTime ? (
                        <>
                          {new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(r.endTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </>
                      ) : (
                        <span className="text-amber-600 font-semibold italic">Ongoing</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                      {r.durationMinutes !== null && r.durationMinutes !== undefined 
                        ? `${r.durationMinutes} mins` 
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>{r.totalAmount ? Number(r.totalAmount).toFixed(2) : '—'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">@ ₹{r.hourlyRate.toFixed(2)}/hr</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        r.status === 'COMPLETED'
                          ? 'bg-campus-50 text-campus-700 border border-campus-200'
                          : r.status === 'ACTIVE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {r.status === 'ACTIVE' ? (
                        <button
                          onClick={() => setOverrideModalRental(r)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                          title="Manually resolve rental situation"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Concluded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-400">
            No rental records found matching filter.
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <button
              disabled={page <= 1}
              onClick={() => fetchRentals(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchRentals(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Manual Override Resolution Modal */}
      {overrideModalRental && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Exceptional Rental Resolution
                </h3>
              </div>
              <button onClick={() => setOverrideModalRental(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Resolve exceptional situations (e.g., student forgot to scan return, bicycle retrieved by campus security, damage inspection). <strong>A mandatory audit log is logged.</strong>
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div>Bicycle: <strong className="font-mono text-slate-900">{overrideModalRental.bicycleCode}</strong></div>
              <div>Student: <strong className="text-slate-900">{overrideModalRental.student?.name} ({overrideModalRental.student?.rollNo})</strong></div>
              <div>Started: {new Date(overrideModalRental.startTime).toLocaleTimeString()}</div>
            </div>

            {overrideError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{overrideError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteOverride} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Resolution Action
                </label>
                <select
                  value={overrideAction}
                  onChange={(e) => setOverrideAction(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="FORCE_RETURN">FORCE RETURN (Conclude session & calculate pro-rata charges)</option>
                  <option value="CANCEL">CANCEL RENTAL (Cancel session without charge)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Mandatory Audit Log Reason Notes *
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="e.g. Bicycle returned to Security Depot by student who experienced phone battery depletion..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalRental(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride || overrideNotes.trim().length < 5}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {submittingOverride ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
