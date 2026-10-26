import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { Asset } from '../../types';
import { sanitizationService } from '../../services/sanitizationService';

interface CompleteWipingModalProps {
  isOpen: boolean;
  asset: (Asset & { activeWipingRecord?: any }) | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_METHODS = [
  'NIST SP 800-88 Rev 1 (Purge / Cryptographic Erase)',
  'NIST SP 800-88 Rev 1 (Clear / 1-Pass Zero Fill)',
  'DoD 5220.22-M (3-Pass Overwrite with Pattern Verification)',
  'DoD 5220.22-M 7-Pass (Enhanced Sanitization)',
  'NVRAM Flash Sanitization & Factory Reset',
  'PanOS Maintenance Erase / FIPS Zeroization',
  'ATA Secure Erase (Enhanced)',
  'Custom / Other',
];

const COMMON_TOOLS = [
  'Blancco Drive Eraser v7.8 / Enterprise v8.2',
  'nwipe v0.34 CLI Engine',
  'DBAN v2.3.0 DoD Kernel',
  'Active@ KillDisk Pro v24.0',
  'Cisco IOS Secure Erase Engine',
  'Dell Storage Center CLI Wipe',
  'Palo Alto Maintenance Mode Zeroizer',
  'Custom Hardware Eraser Bench',
];

export const CompleteWipingModal: React.FC<CompleteWipingModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess,
}) => {
  const [wipingMethod, setWipingMethod] = useState('');
  const [customMethod, setCustomMethod] = useState('');
  const [wipingTool, setWipingTool] = useState('');
  const [customTool, setCustomTool] = useState('');
  const [remarks, setRemarks] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && asset) {
      const activeRecord = asset.activeWipingRecord || asset.wipingRecords?.[0];
      const initialMethod = activeRecord?.wipingMethod || COMMON_METHODS[0];
      const initialTool = activeRecord?.wipingTool || COMMON_TOOLS[0];

      if (COMMON_METHODS.includes(initialMethod)) {
        setWipingMethod(initialMethod);
        setCustomMethod('');
      } else {
        setWipingMethod('Custom / Other');
        setCustomMethod(initialMethod);
      }

      if (COMMON_TOOLS.includes(initialTool)) {
        setWipingTool(initialTool);
        setCustomTool('');
      } else {
        setWipingTool('Custom Hardware Eraser Bench');
        setCustomTool(initialTool);
      }

      setRemarks(activeRecord?.remarks || 'All storage partitions successfully sanitized.');
      setError(null);
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalMethod =
      wipingMethod === 'Custom / Other' ? customMethod.trim() : wipingMethod.trim();
    const finalTool =
      wipingTool === 'Custom Hardware Eraser Bench' && customTool.trim()
        ? customTool.trim()
        : wipingTool.trim();

    if (!finalMethod) {
      setError('Please select or specify a valid data sanitization method.');
      return;
    }

    if (!finalTool) {
      setError('Please select or specify a valid data sanitization tool.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sanitizationService.completeWiping(asset.id, {
        wipingMethod: finalMethod,
        wipingTool: finalTool,
        remarks: remarks.trim() || undefined,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to complete wiping operation.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to record completed wiping operation.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Complete Data Sanitization
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

          {/* Notice Banner */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-800">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
            <div>
              <span className="font-semibold block">Compliance Check</span>
              Asset status will become{' '}
              <span className="font-semibold text-indigo-900">WIPING_COMPLETED</span>{' '}
              and await Phase 6 Admin Verification before final disposition.
            </div>
          </div>

          {/* Wiping Method Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Sanitization Method <span className="text-red-500">*</span>
            </label>
            <select
              value={wipingMethod}
              onChange={(e) => setWipingMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            >
              {COMMON_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {wipingMethod === 'Custom / Other' && (
              <input
                type="text"
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                placeholder="Specify standard or method name..."
                className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            )}
          </div>

          {/* Wiping Tool Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Sanitization Tool / Software Engine <span className="text-red-500">*</span>
            </label>
            <select
              value={wipingTool}
              onChange={(e) => setWipingTool(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            >
              {COMMON_TOOLS.map((tool) => (
                <option key={tool} value={tool}>
                  {tool}
                </option>
              ))}
            </select>
            {wipingTool === 'Custom Hardware Eraser Bench' && (
              <input
                type="text"
                value={customTool}
                onChange={(e) => setCustomTool(e.target.value)}
                placeholder="Specify software/hardware erasure tool..."
                className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Sanitization Audit Remarks & Sector Checksum
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="e.g. All sectors overwritten with random pattern, checksum verified 100% clean."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Completion...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Wiping Completed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
