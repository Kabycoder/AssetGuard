import React from 'react';
import { Recycle, PackagePlus } from 'lucide-react';

export const DisposalPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Disposal & Recycling</h2>
          <p className="text-xs text-slate-500">Track R2/e-Stewards certified recycling and physical destruction</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <PackagePlus className="w-4 h-4" />
          <span>New Disposal Batch</span>
        </button>
      </div>

      {/* Clean Empty State Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <Recycle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Disposal Workflow</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Recycling and destruction tracking module initialized. Ready for Phase 2 data integration.
        </p>
      </div>
    </div>
  );
};
