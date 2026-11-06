import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Bike, 
  Clock, 
  IndianRupee, 
  CreditCard, 
  ArrowRight, 
  Receipt, 
  Calendar,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { CheckoutModal } from '../../components/CheckoutModal';

export const RentalSummaryPage: React.FC = () => {
  const { rentalId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(location.state?.summary || null);
  const [loading, setLoading] = useState(!summary);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!summary && rentalId) {
      // Fetch past rental details
      api.get('/rentals/history?limit=10')
        .then(res => {
          const found = res.data.rentals.find((r: any) => r.id === rentalId);
          if (found) {
            setSummary({
              rentalId: found.id,
              bicycleCode: found.bicycleCode,
              startTime: found.startTime,
              returnTime: found.endTime,
              durationMinutes: found.durationMinutes,
              hourlyRate: found.hourlyRate,
              finalAmount: found.totalAmount,
              payment: found.payment
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [rentalId, summary]);

  const isPaid = summary?.payment?.status === 'SUCCESS';

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-campus-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Rental Record Not Found</h2>
        <Link to="/student/dashboard" className="text-sm text-campus-600 font-semibold hover:underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Return Success Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-campus-100 text-campus-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-campus-600/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rental Concluded</h1>
        <p className="text-sm text-slate-500">
          Bicycle <strong className="text-slate-800">{summary.bicycleCode}</strong> has been safely checked in.
        </p>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Bike className="w-5 h-5 text-campus-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{summary.bicycleCode}</div>
              <div className="text-xs text-slate-400">Order ID: {summary.payment?.orderId || summary.rentalId?.slice(0, 8)}</div>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isPaid 
              ? 'bg-campus-50 text-campus-700 border border-campus-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isPaid ? 'PAID & VERIFIED' : 'PAYMENT PENDING'}
          </span>
        </div>

        {/* Timestamps and Metrics */}
        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              Start Timestamp
            </span>
            <span className="font-semibold text-slate-800">
              {new Date(summary.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
              {new Date(summary.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              Return Timestamp
            </span>
            <span className="font-semibold text-slate-800">
              {new Date(summary.returnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
              {new Date(summary.returnTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-slate-400" />
              Total Elapsed Duration
            </span>
            <span className="font-bold text-slate-900">
              {summary.durationMinutes} minute{summary.durationMinutes === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-slate-400" />
              Applied Hourly Rate
            </span>
            <span className="font-semibold text-slate-800">
              ₹{Number(summary.hourlyRate).toFixed(2)} / hr
            </span>
          </div>

          {/* Amount Calculation */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <div>
              <span className="text-base font-extrabold text-slate-900 block">Total Rental Fare</span>
              <span className="text-[11px] text-slate-400">
                Formula: ({summary.durationMinutes} mins / 60) × ₹{Number(summary.hourlyRate).toFixed(2)}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-campus-700 flex items-center">
              <IndianRupee className="w-6 h-6" />
              <span>{Number(summary.finalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {!isPaid ? (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full py-4 bg-campus-600 hover:bg-campus-700 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-campus-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
            >
              <CreditCard className="w-5 h-5" />
              <span>Pay ₹{Number(summary.finalAmount).toFixed(2)} via UPI / Card</span>
            </button>
          ) : (
            <div className="p-4 bg-campus-50 border border-campus-200 rounded-2xl flex items-center justify-center gap-2 text-campus-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-campus-600" />
              <span>Payment Completed • Transaction Verified</span>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Link
              to="/student/dashboard"
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl text-center transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              to="/student/payments"
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl text-center transition-colors"
            >
              View Transactions
            </Link>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <CheckoutModal
          rentalId={summary.rentalId}
          amount={Number(summary.finalAmount)}
          bicycleCode={summary.bicycleCode}
          onSuccess={() => {
            setCheckoutOpen(false);
            setSummary({
              ...summary,
              payment: { ...summary.payment, status: 'SUCCESS' }
            });
          }}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
};
