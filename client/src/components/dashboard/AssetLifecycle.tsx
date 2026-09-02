import React from 'react';
import {
  Boxes,
  Eraser,
  ShieldCheck,
  Recycle,
  ChevronRight,
} from 'lucide-react';
import { LifecycleStage } from '../../types';

interface AssetLifecycleProps {
  stages: LifecycleStage[];
}

const stageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  registered: Boxes,
  wiping: Eraser,
  verification: ShieldCheck,
  disposal: Recycle,
};

export const AssetLifecycle: React.FC<AssetLifecycleProps> = ({ stages }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-800">Asset Lifecycle</h2>
        <span className="text-xs font-medium text-slate-400">Real-time Pipeline</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {stages.map((stage, idx) => {
          const Icon = stageIcons[stage.id] || Boxes;
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.id} className="relative flex items-center">
              <div
                className={`flex-1 rounded-xl p-4 border transition-all ${stage.bgColor} ${stage.borderColor} hover:border-slate-300`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-xs border border-slate-200/60"
                    style={{ color: stage.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                      {stage.name}
                    </span>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connecting Chevron Arrow (desktop only) */}
              {!isLast && (
                <div className="hidden lg:flex absolute -right-3.5 z-10 w-7 h-7 bg-white rounded-full border border-slate-200 shadow-xs items-center justify-center text-slate-400">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
