import React, { useState, useEffect } from 'react';
import { DollarSign, IndianRupee, Clock, History, CheckCircle2, AlertCircle, Save, Calendar } from 'lucide-react';
import api from '../../services/api';
import { Pricing } from '../../types';

export const AdminPricingPage: React.FC = () => {
  const [pricingHistory, setPricingHistory] = useState<Pricing[]>([]);
  const [newRate, setNewRate] = useState<number>(12.50);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pricing');
      if (res.data.success) {
        setPricingHistory(res.data.pricing || []);
        if (res.data.pricing && res.data.pricing.length > 0) {
          setNewRate(Number(res.data.pricing[0].hourlyRate));
        }
      }
    } catch (err) {
      console.error('Error fetching pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.post('/admin/pricing', {
        hourlyRate: Number(newRate),
        note: note.trim() || undefined
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: `Rental rate successfully updated to ₹${Number(newRate).toFixed(2)}/hour.` });
        setNote('');
        fetchPricing();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update pricing.' });
    } finally {
      setSaving(false);
    }
  };

  const currentRate = pricingHistory.length > 0 ? Number(pricingHistory[0].hourlyRate) : 12.50;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pricing Engine & Rates</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure campus bicycle rental tariff with historical audit tracking
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm ${
          message.type === 'success' 
            ? 'bg-campus-50 border border-campus-200 text-campus-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-campus-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Active Pricing Card */}
        <div className="bg-linear-to-br from-campus-700 to-campus-900 text-white rounded-3xl p-6 shadow-xl shadow-campus-900/10 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-campus-200 mb-2">
              Active Hourly Tariff
            </div>
            <div className="flex items-center text-4xl sm:text-5xl font-extrabold tracking-tight mt-1">
              <IndianRupee className="w-8 h-8" />
              <span>{currentRate.toFixed(2)}</span>
            </div>
            <span className="text-xs text-campus-200 block mt-1">per 60 minutes of riding</span>
          </div>

          <div className="pt-6 border-t border-campus-600/60 mt-6 text-xs text-campus-100 space-y-1">
            <div>• Billing calculated per minute pro-rata</div>
            <div>• Snapshot stored in each rental record</div>
            <div>• Rates apply strictly to new rental sessions</div>
          </div>
        </div>

        {/* Update Form */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Adjust Hourly Rental Rate</h2>
          <p className="text-xs text-slate-500 mb-5">
            Set a new campus rate. The previous rate remains permanently preserved for past and ongoing rentals.
          </p>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                New Hourly Rate (₹ INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  max="500"
                  required
                  value={newRate}
                  onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-extrabold focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Revision Reason Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Campus Spring Festival subsidized tariff adjustment"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving || newRate <= 0}
              className="py-3 px-5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-sm font-bold shadow-md shadow-campus-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing Rate...' : 'Publish New Rate'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Pricing History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900">Historical Pricing Ledger</h3>
          </div>
          <span className="text-xs text-slate-400">{pricingHistory.length} recorded revisions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
        ) : pricingHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Hourly Rate</th>
                  <th className="px-5 py-3">Effective Date</th>
                  <th className="px-5 py-3">Updated By</th>
                  <th className="px-5 py-3">Reason / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pricingHistory.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-extrabold text-slate-900">
                      ₹{Number(p.hourlyRate).toFixed(2)}/hr
                      {idx === 0 && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-campus-50 text-campus-700 border border-campus-200">
                          CURRENT
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {new Date(p.effectiveFrom).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })},{' '}
                      {new Date(p.effectiveFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-800">
                      {p.updatedBy}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {p.note || 'Regular revision'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No pricing history.</div>
        )}
      </div>
    </div>
  );
};
