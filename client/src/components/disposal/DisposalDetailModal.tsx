import React from 'react';
import {
  X,
  FileCheck,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Recycle,
  Tag,
  Flame,
  DollarSign,
  Gift,
} from 'lucide-react';
import { DisposalRecordSummary, Asset } from '../../types';

interface DisposalDetailModalProps {
  isOpen: boolean;
  record: (DisposalRecordSummary & { asset: Asset }) | null;
  onClose: () => void;
}

const METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  RECYCLING: {
    label: 'R2 Certified Recycling',
    icon: <Recycle className="w-4 h-4 text-emerald-600" />,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  PHYSICAL_SHREDDING: {
    label: 'Physical Destruction / Shredding',
    icon: <Flame className="w-4 h-4 text-rose-600" />,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  RESALE: {
    label: 'Secondary Resale / Remarketing',
    icon: <DollarSign className="w-4 h-4 text-blue-600" />,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  DONATION: {
    label: 'Charitable Donation / CSR',
    icon: <Gift className="w-4 h-4 text-purple-600" />,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

export const DisposalDetailModal: React.FC<DisposalDetailModalProps> = ({
  isOpen,
  record,
  onClose,
}) => {
  if (!isOpen || !record) return null;

  const methodInfo =
    METHOD_LABELS[record.disposalMethod] || {
      label: record.disposalMethod,
      icon: <Recycle className="w-4 h-4 text-slate-500" />,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Certificate Header */}
        <div className="px-6 py-5 border-b border-indigo-700 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-700 border border-indigo-400 text-indigo-100 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200 block">
                Certificate of Destruction (COD)
              </span>
              <h3 className="text-base font-bold font-mono text-white">
                {record.certificateNumber || 'COD-PENDING'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Asset Info Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Asset Identification</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Asset Tag:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {record.asset?.assetTag || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Serial Number:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {record.asset?.serialNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Make & Model:</span>
                <span className="font-medium text-slate-800">
                  {record.asset?.brand} {record.asset?.model}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Department:</span>
                <span className="font-medium text-slate-800">
                  {record.asset?.department || 'General IT'}
                </span>
              </div>
            </div>
          </div>

          {/* Disposition Specs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Disposal Method:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${methodInfo.color}`}
              >
                {methodInfo.icon}
                {methodInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Certified Partner:</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {record.vendorName || 'Internal ITAD'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Disposed Date:</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(record.disposedAt).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Authorizing Officer:</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {record.officer?.name || 'Disposal Officer'}
              </span>
            </div>
          </div>

          {/* Remarks */}
          {record.remarks && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <span className="text-[10px] font-semibold uppercase text-amber-800 block">
                Custody & Compliance Notes
              </span>
              <p className="text-xs text-amber-900 leading-relaxed italic">
                "{record.remarks}"
              </p>
            </div>
          )}

          {/* Compliance Badge */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs text-emerald-900 leading-tight">
              <span className="font-semibold block">R2v3 / NIST SP 800-88 Compliant</span>
              This record is immutably stamped and ready for environmental and corporate ESG reporting.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
};
