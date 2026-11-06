import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Info } from 'lucide-react';
import api from '../../services/api';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('admin@campuscycle.edu');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/auth/admin/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Admin authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-slate-900 text-slate-100">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-campus-600 rounded-2xl text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-campus-600/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Fleet Administration</h2>
          <p className="text-sm text-slate-400 mt-1">Authorized campus personnel and operators only</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800 rounded-xl flex items-start gap-2.5 text-sm text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@campuscycle.edu"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-campus-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-campus-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-campus-600 hover:bg-campus-500 text-white rounded-xl font-semibold shadow-lg shadow-campus-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {submitting ? 'Verifying Credentials...' : (
              <>
                <span>Access Management Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-campus-400 shrink-0 mt-0.5" />
          <span>Default seeded credentials: <strong className="text-slate-200">admin@campuscycle.edu</strong> / <strong className="text-slate-200">Admin@123</strong></span>
        </div>
      </div>
    </div>
  );
};
