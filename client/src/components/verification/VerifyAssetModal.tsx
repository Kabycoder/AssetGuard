import React, { useState } from 'react';
import { X, ShieldCheck, Loader2, AlertCircle, CheckCircle2, FileCheck, Layers, Wrench, User } from 'lucide-react';
import { Asset } from '../../types';
import { verificationService } from '../../services/verificationService';

interface VerifyAssetModalProps {
  isOpen: boolean;
  asset: (Asset & { activeWipingRecord?: any }) | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const VerifyAssetModal: React.FC<VerifyAssetModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState('');
  const [checksumAuditPassed, setChecksumAuditPassed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const activeRecord = asset.activeWipingRecord || asset.wipingRecords?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!checksumAuditPassed) {
      setError('You must confirm that sample sector verification and audit checksums passed.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await verificationService.verifyAsset(asset.id, {
        remarks: remarks.trim() || undefined,
        checksumAuditPassed: true,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to verify asset sanitization.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to record verification approval.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Audit & Verify Sanitization
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Asset: {asset.assetTag} ({asset.brand} {asset.model})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification Specs Summary Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Sanitization Audit Summary</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Method:</span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-500" />
                  {activeRecord?.wipingMethod || 'NIST SP 800-88 Rev 1'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tool:</span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-blue-500" />
                  {activeRecord?.wipingTool || 'Blancco Drive Eraser'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Technician:</span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  {activeRecord?.technician?.name || 'IT Officer'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Completed At:</span>
                <span className="font-medium text-slate-800">
                  {activeRecord?.completedAt
                    ? new Date(activeRecord.completedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recently'}
                </span>
              </div>
            </div>

            {activeRecord?.remarks && (
              <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-md border border-slate-100">
                Technician Notes: "{activeRecord.remarks}"
              </p>
            )}
          </div>

          {/* Audit Verification Checkbox */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checksumAuditPassed}
                onChange={(e) => setChecksumAuditPassed(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs text-emerald-900 font-medium leading-relaxed">
                I confirm this hardware storage media has been verified clean and compliant with NIST SP 800-88 / DoD 5220.22-M sanitization standards.
              </span>
            </label>
          </div>

          {/* Admin Audit Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Admin Verification Notes & Certificate Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. Audit verified against Blancco erasure certificate hash #BL-8804."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !checksumAuditPassed}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Approving Verification...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Mark Verified</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
