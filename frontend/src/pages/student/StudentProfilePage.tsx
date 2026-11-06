import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Hash, BookOpen, Phone, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import api from '../../services/api';

export const StudentProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const branches = [
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Electrical & Electronics',
    'Civil Engineering',
    'Biotechnology',
    'Information Technology'
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.patch('/auth/profile', { phone, branch });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
        await refreshUser();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your campus credentials and contact information</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm ${
          message.type === 'success' 
            ? 'bg-campus-50 border border-campus-200 text-campus-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-campus-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>{user?.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Roll Number
              </label>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span>{user?.rollNo}</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                College Email (Primary ID)
              </label>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4 pt-1">
            <h3 className="text-sm font-bold text-slate-800">Update Contact & Academic Info</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department / Branch
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-500 bg-white"
                >
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-campus-600 hover:bg-campus-700 text-white rounded-xl font-bold text-sm shadow-md shadow-campus-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
