import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bike, 
  User as UserIcon, 
  QrCode, 
  Clock, 
  History, 
  CreditCard, 
  LogOut, 
  Menu, 
  X,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasActiveRide, setHasActiveRide] = useState(false);

  useEffect(() => {
    if (user && user.type === 'STUDENT') {
      api.get('/rentals/active')
        .then(res => {
          setHasActiveRide(Boolean(res.data.active));
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStudent = user?.type === 'STUDENT';
  const isAdmin = user?.type === 'ADMIN';

  const navLinks = isStudent ? [
    { label: 'Dashboard', path: '/student/dashboard', icon: Bike },
    { label: 'Scan Bicycle', path: '/student/scan', icon: QrCode },
    { label: 'My Rentals', path: '/student/rentals', icon: History },
    { label: 'Payments', path: '/student/payments', icon: CreditCard },
    { label: 'Profile', path: '/student/profile', icon: UserIcon },
  ] : [];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-campus-600 flex items-center justify-center text-white shadow-md shadow-campus-600/20">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Cycle<span className="text-campus-600">Loop</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider bg-campus-50 text-campus-700 px-2 py-0.5 rounded-full ml-2 border border-campus-200">
                  Campus Sharing
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {isStudent && navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-campus-50 text-campus-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* Active Ride Indicator Pill */}
            {isStudent && hasActiveRide && (
              <Link
                to="/student/active-rental"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-full text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-xs animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Active Ride In Progress</span>
              </Link>
            )}

            {/* User Profile Pill & Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 ml-2">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {user.rollNo || (user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin')}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-campus-700 transition-colors"
                >
                  Student Login
                </Link>
                <Link
                  to="/admin/login"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Admin Portal
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {isStudent && hasActiveRide && (
              <Link
                to="/student/active-rental"
                className="mr-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-full text-amber-800 text-xs font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Ride
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1">
          {user && (
            <div className="pb-3 border-b border-slate-100 mb-2">
              <div className="font-semibold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">
                {user.email} {user.rollNo && `• ${user.rollNo}`}
              </div>
            </div>
          )}

          {isStudent && navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-campus-50 text-campus-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 text-campus-600" />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              <ShieldAlert className="w-5 h-5 text-campus-600" />
              Admin Dashboard
            </Link>
          )}

          {user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 text-left mt-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
