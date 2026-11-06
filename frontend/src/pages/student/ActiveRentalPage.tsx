import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bike, 
  Clock, 
  IndianRupee, 
  MapPin, 
  AlertCircle, 
  QrCode, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { ActiveRental } from '../../types';

export const ActiveRentalPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeRental, setActiveRental] = useState<ActiveRental | null>(null);
  const [loading, setLoading] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const fetchActiveRental = async () => {
    try {
      const res = await api.get('/rentals/active');
      if (res.data.active && res.data.rental) {
        setActiveRental(res.data.rental);
        const startMs = new Date(res.data.rental.startTime).getTime();
        const nowMs = Date.now();
        setTimerSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
      } else {
        setActiveRental(null);
      }
    } catch (err) {
      console.error('Error fetching active rental:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRental();
  }, []);

  // Dynamic seconds ticker
  useEffect(() => {
    if (!activeRental) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRental]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0')
    };
  };

  const timer = formatTimer(timerSeconds);
  const elapsedMinutes = Math.max(1, Math.ceil(timerSeconds / 60));
  const hourlyRate = activeRental?.hourlyRate || 12.50;
  const currentEstimatedFare = Math.max(1.00, Math.round(((elapsedMinutes / 60) * hourlyRate) * 100) / 100);

  // Return Bicycle Directly or via Scan
  const handleDirectReturn = async () => {
    if (!activeRental) return;
    setReturnSubmitting(true);
    setReturnError(null);

    try {
      const res = await api.post('/rentals/return', {
        qrTokenOrCode: activeRental.qrToken || activeRental.bicycleCode
      });

      if (res.data.success) {
        navigate(`/student/rental-summary/${res.data.summary.rentalId}`, {
          state: { summary: res.data.summary }
        });
      }
    } catch (err: any) {
      setReturnError(err.response?.data?.message || 'Error completing bicycle return.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-campus-600"></div>
          <span className="text-sm text-slate-500 font-medium">Loading active rental session...</span>
        </div>
      </div>
    );
  }

  if (!activeRental) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
          <Bike className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Bicycle Rental</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          You do not currently have any bicycle rented on campus.
        </p>
        <Link
          to="/student/scan"
          className="inline-flex items-center gap-2 px-6 py-3 bg-campus-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-campus-700 transition-all"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan to Rent a Bicycle</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Active Ride Badge Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-campus-100 rounded-2xl text-campus-700 flex items-center justify-center font-extrabold text-xl shadow-inner">
              {activeRental.bicycleCode.replace('CYC-', '#')}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-campus-50 text-campus-700 border border-campus-200 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-campus-600 animate-ping"></span>
                ACTIVE SESSION
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">{activeRental.bicycleCode}</h1>
              <p className="text-xs text-slate-500">{activeRental.model}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rental ID</div>
            <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">
              {activeRental.id.slice(0, 13)}...
            </div>
          </div>
        </div>

        {/* Live Elapsed Duration Timer */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 text-center shadow-lg relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-widest text-campus-400 mb-3 flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4 animate-spin text-campus-400" />
            <span>AUTHORITATIVE LIVE TIMER</span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono text-4xl sm:text-6xl font-extrabold tracking-tight">
            <div className="flex flex-col items-center">
              <span>{timer.hours}</span>
              <span className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider mt-1">Hours</span>
            </div>
            <span className="text-slate-600 -translate-y-2">:</span>
            <div className="flex flex-col items-center">
              <span>{timer.minutes}</span>
              <span className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider mt-1">Mins</span>
            </div>
            <span className="text-slate-600 -translate-y-2">:</span>
            <div className="flex flex-col items-center text-campus-400">
              <span>{timer.seconds}</span>
              <span className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider mt-1">Secs</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 mt-4">
            Rental officially started at <strong className="text-slate-200">{new Date(activeRental.startTime).toLocaleTimeString()}</strong>
          </div>
        </div>

        {/* Live Fare Estimation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Applied Rate Snapshot</span>
              <span className="text-lg font-bold text-slate-800">₹{hourlyRate.toFixed(2)} / hr</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
              <Clock className="w-5 h-5 text-campus-600" />
            </div>
          </div>

          <div className="p-4 bg-campus-50/70 rounded-2xl border border-campus-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-campus-800 font-semibold block">Estimated Charges</span>
              <div className="text-2xl font-extrabold text-campus-800 flex items-center">
                <IndianRupee className="w-5 h-5" />
                <span>{currentEstimatedFare.toFixed(2)}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-campus-600 text-white flex items-center justify-center shadow-md shadow-campus-600/30">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>

        {returnError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{returnError}</span>
          </div>
        )}

        {/* Return Action Buttons */}
        <div className="pt-2 space-y-3">
          <button
            onClick={handleDirectReturn}
            disabled={returnSubmitting}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
          >
            {returnSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Calculating Server Bill...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Return Bicycle & Conclude Ride</span>
              </>
            )}
          </button>

          <Link
            to="/student/scan"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors text-center"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            <span>Scan QR Code with Camera to Return</span>
          </Link>
        </div>
      </div>

      {/* Campus Return Guidelines */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-campus-600" />
          <span>Return Checklist & Designated Hubs</span>
        </h3>
        <p className="text-xs text-slate-500">
          Ensure you park the bicycle at any official campus stand (Main Gate, Library Hub, Hostel Block 3, or Sports Complex) and lock the rear wheel latch before concluding your session.
        </p>
      </div>
    </div>
  );
};
