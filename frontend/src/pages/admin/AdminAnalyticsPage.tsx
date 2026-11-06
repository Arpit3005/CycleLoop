import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { BarChart3, TrendingUp, IndianRupee, Bike, MapPin } from 'lucide-react';
import api from '../../services/api';

export const AdminAnalyticsPage: React.FC = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [stationData, setStationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setChartData(res.data.chartData || []);
        setStationData(res.data.stationDistribution || []);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalPeriodRevenue = chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalPeriodRentals = chartData.reduce((acc, curr) => acc + (curr.rentals || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics & Usage Trends</h1>
        <p className="text-sm text-slate-500 mt-0.5">Campus bicycle utilization, peak riding periods, and revenue performance</p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Past 7 Days Revenue</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 flex items-center">
              <IndianRupee className="w-6 h-6 text-campus-600" />
              <span>{totalPeriodRevenue.toFixed(2)}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-campus-50 text-campus-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Past 7 Days Rides Completed</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {totalPeriodRentals}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Bike className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daily Revenue Performance</h2>
            <p className="text-xs text-slate-500">Collected through verified UPI and card checkouts</p>
          </div>
          <span className="text-xs font-bold text-campus-700 bg-campus-50 px-3 py-1 rounded-full border border-campus-200">
            INR (₹)
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily Rentals Volume & Station Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Rides Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rental Session Frequency</h2>
            <p className="text-xs text-slate-500">Daily number of trips across campus</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} trips`, 'Rentals']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="rentals" stroke="#0f172a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} name="Rides" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Station Distribution Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Fleet Distribution by Station</h2>
            <p className="text-xs text-slate-500">Number of bicycles assigned per campus station</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="location" type="category" stroke="#94a3b8" fontSize={10} width={110} />
                <Tooltip
                  formatter={(val: any) => [`${val} bicycles`, 'Total Fleet']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 6, 6, 0]} name="Bicycles" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
