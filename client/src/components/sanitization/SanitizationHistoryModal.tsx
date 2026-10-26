import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Wrench,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Asset, WipingRecordSummary } from '../../types';
import { sanitizationService } from '../../services/sanitizationService';

interface SanitizationHistoryModalProps {
  isOpen: boolean;
  assetId: string | null;
  onClose: () => void;
}

const WIPING_STATUS_STYLES: Record<
  string,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Pending',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  },
  FAILED: {
    label: 'Failed',
    badge: 'bg-red-50 text-red-700 border-red-200',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  },
};

export const SanitizationHistoryModal: React.FC<SanitizationHistoryModalProps> = ({
  isOpen,
  assetId,
  onClose,
}) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [records, setRecords] = useState<WipingRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !assetId) {
      setAsset(null);
      setRecords([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await sanitizationService.getHistory(assetId);
        if (response.success && response.data) {
          setAsset(response.data.asset);
          setRecords(response.data.wipingRecords || []);
        } else {
          setError('Sanitization history not found.');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load sanitization audit history.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, assetId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sanitization Audit Trail
              </h3>
              {asset ? (
                <p className="text-xs text-slate-500 font-mono">
                  {asset.assetTag} • {asset.brand} {asset.model} ({asset.assetType})
                </p>
              ) : (
                <p className="text-xs text-slate-400">Loading asset details...</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-14 flex flex-col items-center justify-center text-slate-400 gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs text-slate-500">Loading audit records...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-slate-700 mb-0.5">
                No Wiping Records Found
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No data sanitization jobs have been logged for this asset yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((rec, index) => {
                const statusStyle =
                  WIPING_STATUS_STYLES[rec.status] || WIPING_STATUS_STYLES.PENDING;

                return (
                  <div
                    key={rec.id || index}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3 transition-colors hover:bg-slate-50/80"
                  >
                    {/* Record Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.badge}`}
                        >
                          {statusStyle.icon}
                          {statusStyle.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {rec.id}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(rec.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Method & Tool */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-100">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Sanitization Method</span>
                        </div>
                        <p className="font-semibold text-slate-800">
                          {rec.wipingMethod || '—'}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Wrench className="w-3.5 h-3.5 text-blue-500" />
                          <span>Erasure Tool / Software</span>
                        </div>
                        <p className="font-medium text-slate-800">
                          {rec.wipingTool || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Execution Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">
                          Technician:
                        </span>
                        <div className="flex items-center gap-1 font-medium text-slate-700 truncate">
                          <UserIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            {rec.technician?.name || 'IT Officer'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">
                          Started:
                        </span>
                        <span className="text-slate-700">
                          {rec.startedAt
                            ? new Date(rec.startedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">
                          Completed:
                        </span>
                        <span className="text-slate-700">
                          {rec.completedAt
                            ? new Date(rec.completedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Remarks / Diagnostics */}
                    {rec.remarks && (
                      <div className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <span className="italic">{rec.remarks}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
