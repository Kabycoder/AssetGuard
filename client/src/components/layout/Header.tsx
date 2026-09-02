import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const routeTitleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/assets': 'Assets',
  '/sanitization': 'Sanitization',
  '/verification': 'Verification',
  '/disposal': 'Disposal',
  '/reports': 'Reports',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const title = routeTitleMap[location.pathname] || 'Dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
        {title}
      </h1>

      {/* Header Actions */}
      <div className="flex items-center gap-3.5">
        {/* Search Assets Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assets..."
            aria-label="Search assets"
            className="w-56 pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
        </button>

        {/* Role Badge Indicator */}
        {user?.role && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/70 rounded-full text-xs font-medium">
            <Shield className="w-3 h-3 text-indigo-600" />
            <span>{user.role.replace('_', ' ')}</span>
          </div>
        )}

        {/* Online Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Online</span>
        </div>

        {/* Logout Action Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out of AssetGuard"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all cursor-pointer ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
