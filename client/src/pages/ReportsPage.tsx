import React from 'react';
import { FileBarChart2, Download } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Compliance & Audit Reports</h2>
          <p className="text-xs text-slate-500">Export ESG, NIST 800-88, and chain-of-custody documentation</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary</span>
        </button>
      </div>

      {/* Clean Empty State Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <FileBarChart2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Reports & Analytics</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Compliance reporting engine initialized. Ready for Phase 2 data integration.
        </p>
      </div>
    </div>
  );
};
