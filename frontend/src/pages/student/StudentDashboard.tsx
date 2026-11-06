import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  QrCode, 
  Bike, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  History, 
  IndianRupee,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { ActiveRental, Bicycle, Rental, Payment } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeRental, setActiveRental] = useState<ActiveRental | null>(null);
  const [availableBicycles, setAvailableBicycles] = useState<Bicycle[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(12.50);
  const [recentRentals, setRecentRentals] = useState<Rental[]>([]);
  const [pendingPayment, setPendingPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const fetchDashboardData = async () => {
    try {
      const [activeRes, bikesRes, rentalsRes, paymentsRes] = await Promise.all([
        api.get('/rentals/active'),
        api.get('/bicycles/available'),
        api.get('/rentals/history?limit=3'),
        api.get('/payments/history?limit=1')
      ]);

      if (activeRes.data.active) {
        setActiveRental(activeRes.data.rental);
        // Calculate initial seconds elapsed from start time
        const start = new Date(activeRes.data.rental.startTime).getTime();
        const now = Date.now();
        setTimerSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      } else {
        setActiveRental(null);
      }

      setAvailableBicycles(bikesRes.data.bicycles || []);
      setHourlyRate(bikesRes.data.hourlyRate || 12.50);
      setRecentRentals(rentalsRes.data.rentals || []);

      // Check pending payment
      if (paymentsRes.data.payments && paymentsRes.data.payments.length > 0) {
        const latest = paymentsRes.data.payments[0];
        if (latest.status === 'PENDING') {
          setPendingPayment(latest);
        } else {
          setPendingPayment(null);
        }
      }
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Live timer tick when ride is active
  useEffect(() => {
    if (!activeRental) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRental]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const currentEstimatedFare = activeRental
    ? Math.max(1.00, Math.round(((Math.max(1, Math.ceil(timerSeconds / 60)) / 60) * activeRental.hourlyRate) * 100) / 100)
    : 0;

  // Station counts
  const stationCounts = availableBicycles.reduce((acc: Record<string, number>, b) => {
    acc[b.location] = (acc[b.location] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-campus-600"></div>
          <span className="text-sm text-slate-500 font-medium">Loading campus bicycle network...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-linear-to-r from-campus-800 to-campus-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-campus-900/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Bike className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-campus-200 mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-campus-300" />
              <span>Campus Mobility System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name}!
            </h1>
            <p className="text-sm text-campus-100 mt-1">
              Roll No: <span className="font-semibold text-white">{user?.rollNo}</span> • {user?.branch}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/student/scan"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-campus-800 rounded-xl font-bold text-sm shadow-md hover:bg-campus-50 transition-all transform active:scale-95"
            >
              <QrCode className="w-5 h-5 text-campus-600" />
              <span>Scan QR Code</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Outstanding Payment Notice */}
      {pendingPayment && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">Outstanding Rental Payment Due</h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                You have a pending charge of <strong className="text-amber-950 font-bold">₹{Number(pendingPayment.amount).toFixed(2)}</strong> for order #{pendingPayment.orderId.slice(-8)}.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/student/checkout/${pendingPayment.rental?.id || ''}`)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            Pay ₹{Number(pendingPayment.amount).toFixed(2)} Now
          </button>
        </div>
      )}

      {/* Active Rental Card */}
      {activeRental ? (
        <div className="bg-white rounded-2xl border-2 border-campus-500 shadow-lg p-5 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-campus-500 text-white px-4 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>Ride in progress</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Rented Bicycle</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-campus-100 rounded-xl flex items-center justify-center text-campus-700 font-extrabold text-lg shadow-inner">
                  {activeRental.bicycleCode.replace('CYC-', '#')}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{activeRental.bicycleCode}</h3>
                  <p className="text-xs text-slate-500">{activeRental.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Station: {activeRental.location}</span>
              </div>
            </div>

            {/* Live Timer */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-campus-600" />
                <span>Elapsed Duration</span>
              </div>
              <div className="text-3xl font-mono font-extrabold text-slate-900 tracking-wider">
                {formatTimer(timerSeconds)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Started at {new Date(activeRental.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Estimated Cost & Return Action */}
            <div className="flex flex-col items-center md:items-end justify-center space-y-3">
              <div className="text-center md:text-right">
                <div className="text-xs font-semibold text-slate-500">Estimated Fare</div>
                <div className="text-2xl font-extrabold text-campus-700 flex items-center justify-center md:justify-end">
                  <IndianRupee className="w-5 h-5" />
                  <span>{currentEstimatedFare.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-slate-400">@ ₹{activeRental.hourlyRate.toFixed(2)}/hr</div>
              </div>

              <Link
                to="/student/scan"
                className="w-full sm:w-auto px-6 py-2.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-sm font-bold shadow-md shadow-campus-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan to Return</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Available Fleet Hubs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campus Bicycle Stations</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time availability of bicycles for instant unlock</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-campus-700 bg-campus-50 px-3 py-1.5 rounded-full border border-campus-200">
              <CheckCircle2 className="w-4 h-4 text-campus-600" />
              <span>{availableBicycles.length} Bicycles Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {Object.keys(stationCounts).length > 0 ? (
              Object.entries(stationCounts).map(([station, count]) => (
                <div key={station} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-campus-600 shadow-2xs">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{station}</div>
                      <div className="text-xs text-slate-500">Pick up or return stand</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-campus-700">{count}</span>
                    <span className="text-[11px] text-slate-400 block">bikes</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-sm text-slate-500">
                All bicycles currently in use or undergoing maintenance.
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Standard campus rental rate: <strong className="text-slate-800 font-bold">₹{hourlyRate.toFixed(2)}/hour</strong></span>
            <Link to="/student/scan" className="text-campus-600 font-semibold hover:underline flex items-center gap-1">
              Start Ride <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Tips & Safety Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Riding Guidelines</h3>
            <p className="text-xs text-slate-500 mb-4">Campus safety and rental rules</p>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-campus-100 text-campus-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <span>Scan the QR code on the handlebar or frame to unlock the bicycle.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-campus-100 text-campus-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <span>Ride only within campus designated cycle lanes and pedestrian areas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-campus-100 text-campus-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <span>Park the bicycle at any designated hub and scan the QR code to end the ride.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-campus-100 text-campus-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                <span>Complete the digital UPI payment once the return bill is calculated.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Helpline: campus-transport@campuscycle.edu
          </div>
        </div>
      </div>

      {/* Recent Rentals Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-bold text-slate-900">Recent Rides</h3>
          </div>
          <Link
            to="/student/rentals"
            className="text-xs font-semibold text-campus-600 hover:text-campus-700 flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRentals.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentRentals.map((r) => (
              <div key={r.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                    <Bike className="w-5 h-5 text-campus-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{r.bicycleCode}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(r.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {r.durationMinutes || 0} mins ride
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900">
                    ₹{r.totalAmount ? Number(r.totalAmount).toFixed(2) : '0.00'}
                  </div>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.status === 'COMPLETED'
                      ? 'bg-campus-50 text-campus-700 border border-campus-200'
                      : r.status === 'ACTIVE'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-slate-500">
            No previous rentals found. Start your first campus ride!
          </div>
        )}
      </div>
    </div>
  );
};
