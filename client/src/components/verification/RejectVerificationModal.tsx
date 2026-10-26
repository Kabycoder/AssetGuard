import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Asset } from '../../types';
import { verificationService } from '../../services/verificationService';

interface RejectVerificationModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
}

const REJECTION_REASONS = [
  'Sample sector audit revealed non-zeroed residual data blocks',
  'Sanitization method does not meet NIST SP 800-88 Purge requirement for this classification',
  'Incomplete erasure log or missing hardware drive serial verification',
  'SMART hardware health warnings / pending sector reallocation post-wipe',
  'Technician used uncertified wiping utility version',
  'Other compliance / verification audit discrepancy',
];

export const RejectVerificationModal: React.FC<RejectVerificationModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess,
}) => {
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalReason =
      rejectionReason === 'Other compliance / verification audit discrepancy'
        ? customReason.trim() || rejectionReason
        : rejectionReason;

    if (!finalReason) {
      setError('Please provide a specific rejection reason for the audit log.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await verificationService.rejectAsset(asset.id, {
        rejectionReason: finalReason,
        remarks: remarks.trim() || undefined,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to reject verification.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to record verification rejection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-red-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reject Data Sanitization
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

          {/* Impact Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <RotateCcw className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
            <div>
              <span className="font-semibold block">Audit & Workflow Impact</span>
              This record will be permanently flagged as{' '}
              <span className="font-semibold text-red-700">REJECTED</span> in compliance history. The asset status will reset to{' '}
              <span className="font-semibold text-amber-800">WIPING_PENDING</span> for the IT technician to execute re-sanitization.
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Audit Non-Compliance Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              required
            >
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {rejectionReason === 'Other compliance / verification audit discrepancy' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify specific non-compliance finding..."
                className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                required
              />
            )}
          </div>

          {/* Re-wiping Instructions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Admin Corrective Action Instructions for IT Officer
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="e.g. Please re-run DoD 5220.22-M 7-pass overwrite on test bench C and verify sector 0x88."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
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
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Rejection & Request Re-wipe</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
