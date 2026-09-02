import React from 'react';
import {
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Recycle,
} from 'lucide-react';
import { KpiCardData } from '../../types';

interface KpiGridProps {
  kpis: KpiCardData[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Recycle,
};

const colorStyles: Record<
  KpiCardData['accentColor'],
  { iconBg: string; iconColor: string; badgeBg: string; badgeColor: string }
> = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-50',
    badgeColor: 'text-indigo-700',
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-50',
    badgeColor: 'text-blue-700',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeColor: 'text-emerald-700',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-50',
    badgeColor: 'text-amber-700',
  },
};

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi) => {
        const IconComponent = iconMap[kpi.icon] || HardDrive;
        const styles = colorStyles[kpi.accentColor];

        return (
          <div
            key={kpi.id}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{kpi.title}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${styles.iconBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {kpi.formattedValue}
              </span>
              {kpi.change && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badgeBg} ${styles.badgeColor}`}>
                  {kpi.change}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
