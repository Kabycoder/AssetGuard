import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Wrench,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Building,
  Barcode,
} from 'lucide-react';
import { Asset, WipingRecordSummary } from '../../types';
import { verificationService } from '../../services/verificationService';

interface VerificationDetailModalProps {
  isOpen: boolean;
  assetId: string | null;
  onClose: () => void;
}

const VERIFICATION_STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Pending Admin Audit',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  },
  VERIFIED: {
    label: 'Verified & Certified Clean',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  },
  REJECTED: {
    label: 'Rejected (Requires Re-wipe)',
    badge: 'bg-red-50 text-red-700 border-red-200',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
  },
};

export const VerificationDetailModal: React.FC<VerificationDetailModalProps> = ({
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

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await verificationService.getDetail(assetId);
        if (response.success && response.data) {
          setAsset(response.data.asset);
          setRecords(response.data.wipingRecords || []);
        } else {
          setError('Verification details not found.');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load verification details.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, assetId]);

  if (!isOpen) return null;

  const latestRecord = records[0];
  const verificationConfig =
    VERIFICATION_STATUS_CONFIG[latestRecord?.verificationStatus || 'PENDING'] ||
    VERIFICATION_STATUS_CONFIG.PENDING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Verification Certificate & Audit Detail
              </h3>
              {asset ? (
                <p className="text-xs text-slate-500 font-mono">
                  {asset.assetTag} • {asset.brand} {asset.model} ({asset.assetType})
                </p>
              ) : (
                <p className="text-xs text-slate-400">Loading audit details...</p>
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
        <div className="p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-14 flex flex-col items-center justify-center text-slate-400 gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs text-slate-500">Loading verification audit...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : !asset ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Asset not found.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Ribbon */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                    Current Audit Status
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${verificationConfig.badge}`}
                    >
                      {verificationConfig.icon}
                      {verificationConfig.label}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                    Asset Status
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-800">
                    {asset.status}
                  </span>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 bg-white text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Barcode className="w-3 h-3" /> Serial Number:
                  </span>
                  <p className="font-mono font-semibold text-slate-800">
                    {asset.serialNumber}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Building className="w-3 h-3" /> Department:
                  </span>
                  <p className="font-medium text-slate-800">{asset.department || '—'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Purchase Date:
                  </span>
                  <p className="text-slate-700">
                    {asset.purchaseDate
                      ? new Date(asset.purchaseDate).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Sanitization & Verification Breakdown */}
              {latestRecord && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    <span>Sanitization Specifications</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">
                        Sanitization Method:
                      </span>
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        {latestRecord.wipingMethod}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">
                        Erasure Tool / Software:
                      </span>
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Wrench className="w-3.5 h-3.5 text-blue-500" />
                        {latestRecord.wipingTool}
                      </p>
                    </div>
                  </div>

                  {/* Technician & Verifier Metadata */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">
                        Wiping Technician:
                      </span>
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        <span>{latestRecord.technician?.name || 'IT Officer'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {latestRecord.completedAt
                          ? new Date(latestRecord.completedAt).toLocaleString()
                          : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">
                        Audit Verifier (Admin):
                      </span>
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        <span>{latestRecord.verifiedBy?.name || 'Admin'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {latestRecord.verifiedAt
                          ? new Date(latestRecord.verifiedAt).toLocaleString()
                          : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason if rejected */}
                  {latestRecord.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
                      <span className="font-semibold flex items-center gap-1.5 text-red-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        Rejection Reason:
                      </span>
                      <p>{latestRecord.rejectionReason}</p>
                    </div>
                  )}

                  {/* Remarks */}
                  {latestRecord.remarks && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 italic">
                      "{latestRecord.remarks}"
                    </div>
                  )}
                </div>
              )}
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
