import React, { useState, useEffect } from 'react';
import { CreditCard, IndianRupee, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Payment } from '../../types';

export const PaymentHistoryPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/payments/history?page=${p}&limit=10`);
      setPayments(res.data.payments || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment & Transactions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Digital payment records, invoices, and gateway verification logs</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campus-600 mx-auto mb-2"></div>
            Loading transactions...
          </div>
        ) : payments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => {
              const isSuccess = p.status === 'SUCCESS';
              return (
                <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSuccess ? 'bg-campus-50 text-campus-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                          Bicycle {p.rental?.bicycleCode || 'Campus Ride'}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isSuccess
                            ? 'bg-campus-50 text-campus-700 border border-campus-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Order Ref: {p.orderId}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span>• Method: {p.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-lg font-extrabold text-slate-900 flex items-center sm:justify-end">
                      <IndianRupee className="w-4 h-4 text-slate-600" />
                      <span>{Number(p.amount).toFixed(2)}</span>
                    </div>
                    {p.paymentId && (
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        Txn: {p.paymentId.slice(0, 16)}...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">
            No transaction records found.
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <button
              disabled={page <= 1}
              onClick={() => fetchPayments(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchPayments(page + 1)}
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
