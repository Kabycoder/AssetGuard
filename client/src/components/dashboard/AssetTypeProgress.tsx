import React from 'react';
import { AssetTypeBreakdown } from '../../types';

interface AssetTypeProgressProps {
  types: AssetTypeBreakdown[];
}

export const AssetTypeProgress: React.FC<AssetTypeProgressProps> = ({ types }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">Top Asset Types</h2>
        <span className="text-xs text-slate-400 font-medium">By Device Category</span>
      </div>

      <div className="space-y-4">
        {types.map((item) => (
          <div key={item.type} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{item.type}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{item.count.toLocaleString()}</span>
                <span className="text-xs text-slate-400">({item.percentage}%)</span>
              </div>
            </div>
            {/* Progress Track */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
