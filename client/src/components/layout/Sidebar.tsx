import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Eraser,
  ShieldCheck,
  Recycle,
  FileBarChart2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: Role[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', path: '/assets', icon: Boxes },
  {
    name: 'Sanitization',
    path: '/sanitization',
    icon: Eraser,
    allowedRoles: ['ADMIN', 'IT_OFFICER'],
  },
  {
    name: 'Verification',
    path: '/verification',
    icon: ShieldCheck,
    allowedRoles: ['ADMIN', 'IT_OFFICER'],
  },
  {
    name: 'Disposal',
    path: '/disposal',
    icon: Recycle,
    allowedRoles: ['ADMIN', 'DISPOSAL_OFFICER'],
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: FileBarChart2,
    allowedRoles: ['ADMIN', 'DISPOSAL_OFFICER'],
  },
];

const roleLabelMap: Record<Role, string> = {
  ADMIN: 'Administrator',
  IT_OFFICER: 'IT Officer',
  DISPOSAL_OFFICER: 'Disposal Officer',
};

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const userRole: Role = user?.role || 'ADMIN';
  const roleLabel = roleLabelMap[userRole] || 'User';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AG';

  // Filter navigation items based on current user role
  const visibleNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return userRole === 'ADMIN' || item.allowedRoles.includes(userRole);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight">AssetGuard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs ring-2 ring-slate-700">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Authorized User'}
            </p>
            <p className="text-xs text-indigo-400 font-medium truncate">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
