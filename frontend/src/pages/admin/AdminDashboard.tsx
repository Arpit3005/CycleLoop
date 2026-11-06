import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bike, 
  Users, 
  History, 
  IndianRupee, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  PlusCircle, 
  QrCode,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import { DashboardStats } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRentals, setRecentRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentRentals(res.data.recentRentals || []);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-campus-600"></div>
          <span className="text-sm text-slate-500 font-medium">Loading operations metrics...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Rides',
      value: stats?.activeRentals || 0,
      sub: 'Currently on campus',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.totalRevenue || 0).toFixed(2)}`,
      sub: 'Verified digital payments',
      icon: IndianRupee,
      color: 'text-campus-600',
      bg: 'bg-campus-50',
      border: 'border-campus-200'
    },
    {
      title: 'Available Fleet',
      value: stats?.availableBicycles || 0,
      sub: `of ${stats?.totalBicycles || 0} total bicycles`,
      icon: Bike,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    {
      title: 'Registered Students',
      value: stats?.totalStudents || 0,
      sub: 'Campus riders enrolled',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      title: 'Maintenance Depot',
      value: stats?.maintenanceBicycles || 0,
      sub: 'Bicycles under repair',
      icon: Wrench,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200'
    },
    {
      title: 'Hourly Rental Rate',
      value: `₹${(stats?.currentHourlyRate || 12.50).toFixed(2)}`,
      sub: 'Configured pricing snapshot',
      icon: DollarSign,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Operations Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time status of Campus CycleLoop ecosystem</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/bicycles"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-bold shadow-md shadow-campus-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Fleet</span>
          </Link>
          <Link
            to="/admin/pricing"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>Update Rates</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-white border ${card.border} shadow-xs space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</span>
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{card.value}</div>
              <div className="text-xs text-slate-400">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Action & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Rental Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Latest Campus Rental Sessions</h2>
              <p className="text-xs text-slate-500">Live feed of student bicycle usage</p>
            </div>
            <Link to="/admin/rentals" className="text-xs font-bold text-campus-600 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentRentals.length > 0 ? (
              recentRentals.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {r.bicycleCode}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">{r.studentName} ({r.rollNo})</div>
                      <div className="text-[11px] text-slate-400">
                        Started: {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {r.amount ? `₹${Number(r.amount).toFixed(2)}` : 'In Progress'}
                    </div>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'COMPLETED'
                        ? 'bg-campus-50 text-campus-700'
                        : r.status === 'ACTIVE'
                        ? 'bg-amber-50 text-amber-700 animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent rental records.
              </div>
            )}
          </div>
        </div>

        {/* Fleet Distribution Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Campus Stations</h2>
          <p className="text-xs text-slate-500 -mt-2">Fleet deployment across primary stands</p>

          <div className="space-y-3 pt-2">
            {[
              { station: 'Main Gate Station', count: 3, capacity: 5 },
              { station: 'Central Library Hub', count: 2, capacity: 5 },
              { station: 'Hostel Block 3 Hub', count: 2, capacity: 5 },
              { station: 'Sports Complex Stand', count: 1, capacity: 4 }
            ].map((hub, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>{hub.station}</span>
                  <span className="text-campus-700">{hub.count} / {hub.capacity} slots</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-campus-600 h-1.5 rounded-full"
                    style={{ width: `${(hub.count / hub.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/admin/analytics"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Usage & Revenue Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
