import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Clock, Calendar, IndianRupee, ArrowRight, History, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { Rental } from '../../types';

export const RentalHistoryPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRentals = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/rentals/history?page=${p}&limit=10`);
      setRentals(res.data.rentals || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.error('Error fetching rentals history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals(1);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rental History</h1>
          <p className="text-sm text-slate-500 mt-0.5">Comprehensive log of all your campus bicycle sessions</p>
        </div>
        <Link
          to="/student/scan"
          className="inline-flex items-center gap-2 px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-campus-600/20 transition-all self-start sm:self-auto"
        >
          <Bike className="w-4 h-4" />
          <span>Rent a Bicycle</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campus-600 mx-auto mb-2"></div>
            Loading rentals...
          </div>
        ) : rentals.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {rentals.map((r) => {
              const isPaid = r.payment?.status === 'SUCCESS';
              return (
                <div key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 bg-campus-50 border border-campus-100 text-campus-700 rounded-2xl flex items-center justify-center font-extrabold text-base shrink-0">
                      {r.bicycleCode.replace('CYC-', '#')}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">{r.bicycleCode}</span>
                        <span className="text-xs text-slate-500 hidden sm:inline">({r.model})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'COMPLETED'
                            ? 'bg-campus-50 text-campus-700 border border-campus-200'
                            : r.status === 'ACTIVE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(r.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {r.durationMinutes || 0} mins
                        </span>
                        <span>Rate: ₹{r.hourlyRate.toFixed(2)}/hr</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-lg font-extrabold text-slate-900 flex items-center">
                      <IndianRupee className="w-4 h-4 text-slate-600" />
                      <span>{r.totalAmount ? Number(r.totalAmount).toFixed(2) : '0.00'}</span>
                    </div>

                    <div className="mt-1">
                      {r.status === 'COMPLETED' && !isPaid ? (
                        <Link
                          to={`/student/rental-summary/${r.id}`}
                          className="px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors inline-block"
                        >
                          Pay Dues
                        </Link>
                      ) : r.status === 'COMPLETED' ? (
                        <span className="text-[11px] font-semibold text-campus-700 bg-campus-50 px-2.5 py-0.5 rounded-full border border-campus-200">
                          Paid
                        </span>
                      ) : (
                        <Link
                          to="/student/active-rental"
                          className="px-3 py-1 bg-campus-600 text-white rounded-lg text-xs font-bold hover:bg-campus-700 transition-colors inline-block"
                        >
                          View Live
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">
            No past rental rides recorded.
          </div>
        )}

        {/* Pagination */}
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
    </div>
  );
};
