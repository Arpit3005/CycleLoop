import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Mail, 
  BookOpen, 
  IndianRupee, 
  History, 
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStudents = async (p = 1) => {
    setLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(p));
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/students?${params.toString()}`);
      setStudents(res.data.students || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(1);
  };

  const handleToggleStatus = async (studentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await api.patch(`/admin/students/${studentId}/status`, { status: newStatus });
      if (res.data.success) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update student status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Directory & Authorization</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage registered campus riders, account standing, and ride statistics</p>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, roll no, email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['', 'ACTIVE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-campus-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st || 'All Students'}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campus-600 mx-auto mb-2"></div>
            Loading students...
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Branch</th>
                  <th className="px-5 py-3.5">Total Rides</th>
                  <th className="px-5 py-3.5">Total Spent</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{s.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {s.rollNo}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {s.branch}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                      {s.totalRentals} rides
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-campus-700">
                      ₹{s.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        s.status === 'ACTIVE'
                          ? 'bg-campus-50 text-campus-700 border border-campus-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                          s.status === 'ACTIVE'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : 'bg-campus-50 hover:bg-campus-100 text-campus-700'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-400">
            No students found matching your query.
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <button
              disabled={page <= 1}
              onClick={() => fetchStudents(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchStudents(page + 1)}
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
