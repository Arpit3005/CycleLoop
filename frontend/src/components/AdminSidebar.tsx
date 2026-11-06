import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bike, 
  Users, 
  History, 
  DollarSign, 
  Wrench, 
  BarChart3, 
  FileText,
  ExternalLink
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const menuItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Fleet & QR Codes', path: '/admin/bicycles', icon: Bike },
    { label: 'Student Directory', path: '/admin/students', icon: Users },
    { label: 'Rental Sessions', path: '/admin/rentals', icon: History },
    { label: 'Pricing Engine', path: '/admin/pricing', icon: DollarSign },
    { label: 'Maintenance Depot', path: '/admin/maintenance', icon: Wrench },
    { label: 'Analytics & Trends', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit & Compliance', path: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 border-r border-slate-800">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Operations Console
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-campus-600 text-white shadow-md shadow-campus-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <NavLink
          to="/student/dashboard"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-campus-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>Open Student Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </NavLink>
      </div>
    </aside>
  );
};
