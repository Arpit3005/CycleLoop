import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bike, ArrowRight, Lock, User, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const StudentLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/auth/student/login', { identifier, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = (email: string) => {
    setIdentifier(email);
    setPassword('Student@123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-campus-600 rounded-2xl text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-campus-600/30">
            <Bike className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Portal</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in with your campus credentials to rent bicycles</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              College Email or Roll Number
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="21CS042 or aarav@campuscycle.edu"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-campus-500 focus:border-transparent text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-campus-500 focus:border-transparent text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-campus-600 hover:bg-campus-700 text-white rounded-xl font-semibold shadow-md shadow-campus-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {submitting ? 'Authenticating...' : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login helpers */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium text-center mb-2.5">
            Quick Fill Demo Accounts:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('aarav@campuscycle.edu')}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Aarav (21CS042)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('priya@campuscycle.edu')}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Priya (21EC019)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-600">
          First time renting on campus?{' '}
          <Link to="/register" className="font-semibold text-campus-600 hover:text-campus-700 underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
};
