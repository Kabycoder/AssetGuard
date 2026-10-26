import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Asset } from '../../types';
import { sanitizationService } from '../../services/sanitizationService';

interface FailWipingModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FAILURE_REASONS = [
  'Bad sectors / uncorrectable I/O errors detected during overwrite',
  'Hardware CRC checksum verification mismatch',
  'Drive firmware locked or non-responsive to ATA sanitize commands',
  'Wiping software process crashed or timed out unexpectedly',
  'Power interruption during block erasure cycle',
  'Manual technician abort due to hardware overheating',
  'Other hardware / controller failure',
];

export const FailWipingModal: React.FC<FailWipingModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState(FAILURE_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalReason =
      reason === 'Other hardware / controller failure'
        ? customReason.trim() || reason
        : reason;

    try {
      setIsLoading(true);
      const response = await sanitizationService.failWiping(asset.id, {
        reason: finalReason,
        remarks: remarks.trim() || undefined,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to mark wiping as failed.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to record wiping failure.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mark Sanitization as Failed
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Workflow Impact Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <RotateCcw className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
            <div>
              <span className="font-semibold block">Workflow Reset Notice</span>
              The active wiping record will be preserved in history as{' '}
              <span className="font-semibold text-red-700">FAILED</span>. The asset status will reset to{' '}
              <span className="font-semibold text-amber-800">WIPING_PENDING</span> to allow technician re-wiping.
            </div>
          </div>

          {/* Failure Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Diagnostic Failure Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              required
            >
              {FAILURE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {reason === 'Other hardware / controller failure' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify specific error code or symptom..."
                className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                required
              />
            )}
          </div>

          {/* Detailed Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Technician Diagnostic Notes
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Provide context regarding sector addresses, tool output, or hardware symptoms..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
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
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-amber-600/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Mark as Failed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
