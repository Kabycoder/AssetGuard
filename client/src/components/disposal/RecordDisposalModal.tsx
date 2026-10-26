import React, { useState } from 'react';
import {
  X,
  Recycle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileCheck2,
  Flame,
  DollarSign,
  Gift,
} from 'lucide-react';
import { Asset, DisposalMethod } from '../../types';
import { disposalService } from '../../services/disposalService';

interface RecordDisposalModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DISPOSAL_METHODS: {
  value: DisposalMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'RECYCLING',
    label: 'R2 Certified Recycling',
    desc: 'Environmentally sound e-waste dismantling and materials recovery.',
    icon: <Recycle className="w-4 h-4 text-emerald-600" />,
  },
  {
    value: 'PHYSICAL_SHREDDING',
    label: 'Physical Destruction / Shredding',
    desc: 'High-security mechanical shredding of chassis and drives down to < 2mm.',
    icon: <Flame className="w-4 h-4 text-rose-600" />,
  },
  {
    value: 'RESALE',
    label: 'Secondary Market Resale / Remarketing',
    desc: 'Asset refurbished with sanitized storage for corporate surplus recovery.',
    icon: <DollarSign className="w-4 h-4 text-blue-600" />,
  },
  {
    value: 'DONATION',
    label: 'Charitable Donation / CSR Transfer',
    desc: 'Transfer of sanitized equipment to non-profit or educational institutions.',
    icon: <Gift className="w-4 h-4 text-purple-600" />,
  },
];

export const RecordDisposalModal: React.FC<RecordDisposalModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess,
}) => {
  const [disposalMethod, setDisposalMethod] = useState<DisposalMethod>('RECYCLING');
  const [vendorName, setVendorName] = useState('EcoRecycle Solutions Inc.');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsLoading(true);
      const response = await disposalService.recordDisposal(asset.id, {
        disposalMethod,
        vendorName: vendorName.trim() || undefined,
        certificateNumber: certificateNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to record asset disposition.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to record asset disposition.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Recycle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Execute Final Asset Disposition
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
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Method Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Disposition & Recycling Method <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {DISPOSAL_METHODS.map((method) => {
                const isSelected = disposalMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setDisposalMethod(method.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200 mt-0.5">
                      {method.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        {method.label}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {method.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vendor Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Certified ITAD / Recycling Partner
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. EcoRecycle Solutions Inc."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Certificate Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Certificate of Destruction (COD) / Manifest #
            </label>
            <div className="relative">
              <FileCheck2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="Leave blank to auto-generate (e.g. COD-202609-8472)"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Disposition Remarks & Audit Notes
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. Material custody transfer manifest signed. Zero landfill certificate issued."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Disposition...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Disposition</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
