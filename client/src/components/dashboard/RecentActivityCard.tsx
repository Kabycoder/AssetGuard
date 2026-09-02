import React from 'react';
import {
  Boxes,
  Eraser,
  ShieldCheck,
  Recycle,
} from 'lucide-react';
import { ActivityItem } from '../../types';

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

const activityConfig: Record<
  ActivityItem['type'],
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  registered: {
    icon: Boxes,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-100',
  },
  wiping_started: {
    icon: Eraser,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
  },
  verified: {
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
  },
  disposed: {
    icon: Recycle,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
  },
};

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  activities,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-800">Recent Activity</h2>
        <span className="text-xs text-slate-400 font-medium">Audit Trail</span>
      </div>

      <div className="space-y-3.5">
        {activities.map((act) => {
          const config = activityConfig[act.type] || activityConfig.registered;
          const Icon = config.icon;

          return (
            <div
              key={act.id}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${config.bg} ${config.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {act.title}
                    </p>
                    <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {act.assetId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{act.assetType}</p>
                </div>
              </div>

              <span className="text-xs text-slate-400 flex-shrink-0 ml-4">
                {act.relativeTime}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
