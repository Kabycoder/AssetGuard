import React from 'react';
import { ShieldCheck, CheckSquare } from 'lucide-react';

export const VerificationPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Sanitization Verification</h2>
          <p className="text-xs text-slate-500">Audit wiped storage and generate cryptographic certificates</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Verify Asset</span>
        </button>
      </div>

      {/* Clean Empty State Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Verification Queue</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Audit and verification engine initialized. Ready for Phase 2 data integration.
        </p>
      </div>
    </div>
  );
};
