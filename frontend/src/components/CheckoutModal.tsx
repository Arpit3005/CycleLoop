import React, { useState } from 'react';
import { 
  CreditCard, 
  X, 
  CheckCircle2, 
  IndianRupee, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import api from '../services/api';

interface CheckoutModalProps {
  rentalId: string;
  amount: number;
  bicycleCode: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  rentalId,
  amount,
  bicycleCode,
  onSuccess,
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'UPI_GPAY' | 'UPI_PHONEPE' | 'UPI_PAYTM' | 'CARD'>('UPI_GPAY');
  const [upiId, setUpiId] = useState('student@okcampus');
  const [processing, setProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setProcessing(true);
    setError(null);

    try {
      // 1. Create or retrieve payment order
      const orderRes = await api.post('/payments/create-order', { rentalId });
      const { orderId } = orderRes.data.order;

      // Simulate realistic payment gateway processing
      await new Promise(res => setTimeout(res, 1200));

      // 2. Call server-side verification endpoint
      const verifyRes = await api.post('/payments/verify', {
        orderId,
        paymentId: `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        method: selectedMethod.startsWith('UPI') ? 'UPI' : 'CARD'
      });

      if (verifyRes.data.success) {
        setSuccessReceipt(verifyRes.data.receipt);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-campus-100 text-campus-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Campus Digital Checkout</h3>
              <p className="text-[11px] text-slate-400">UPI & Digital Payments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successReceipt ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 bg-campus-100 text-campus-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-campus-600/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">Payment Successful!</h4>
            <p className="text-xs text-slate-500">
              Transaction ID: <span className="font-mono font-bold text-slate-700">{successReceipt.paymentId}</span>
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
              ₹{Number(amount).toFixed(2)} paid via {successReceipt.method} for bicycle {bicycleCode}
            </div>
          </div>
        ) : (
          <>
            {/* Amount display */}
            <div className="bg-campus-50/70 border border-campus-200 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-campus-800 uppercase tracking-wider block">Payable Amount</span>
              <div className="text-3xl font-extrabold text-campus-900 flex items-center justify-center mt-0.5">
                <IndianRupee className="w-7 h-7" />
                <span>{Number(amount).toFixed(2)}</span>
              </div>
              <span className="text-[11px] text-campus-700 mt-1 block">Rental for Bicycle {bicycleCode}</span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Select UPI App / Payment Option
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'UPI_GPAY', name: 'Google Pay', icon: Smartphone },
                  { id: 'UPI_PHONEPE', name: 'PhonePe', icon: Smartphone },
                  { id: 'UPI_PAYTM', name: 'Paytm UPI', icon: Smartphone },
                  { id: 'CARD', name: 'Debit / Card', icon: CreditCard }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedMethod(item.id as any)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all text-left ${
                      selectedMethod === item.id
                        ? 'border-campus-600 bg-campus-50 text-campus-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 text-campus-600 shrink-0" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedMethod.startsWith('UPI') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UPI VPA / Handle
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@okhdfcbank"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={processing}
              className="w-full py-3.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-campus-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Transaction with Gateway...</span>
                </>
              ) : (
                <>
                  <span>Complete Payment of ₹{Number(amount).toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-campus-600" />
              <span>Simulated Campus UPI Gateway • End-to-End Encrypted</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
