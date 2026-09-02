import React from 'react';
import { Boxes, Plus } from 'lucide-react';

export const AssetsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Asset Inventory</h2>
          <p className="text-xs text-slate-500">Manage and track all registered hardware assets</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Asset</span>
        </button>
      </div>

      {/* Clean Empty State Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <Boxes className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Asset Repository</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Asset inventory management module initialized. Ready for Phase 2 data integration.
        </p>
      </div>
    </div>
  );
};
