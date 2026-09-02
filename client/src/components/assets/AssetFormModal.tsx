import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Plus, Edit2 } from 'lucide-react';
import { Asset, CreateAssetDto, UpdateAssetDto } from '../../types';
import { assetService } from '../../services/assetService';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asset: Asset) => void;
  initialData?: Asset | null;
}

const COMMON_ASSET_TYPES = [
  'Laptop',
  'Workstation',
  'Rack Server',
  'Enterprise Switch',
  'SAN Storage Array',
  'Firewall Appliance',
  'Desktop',
  'Tablet',
  'Other',
];

const COMMON_DEPARTMENTS = [
  'Engineering',
  'Finance',
  'Human Resources',
  'Information Security',
  'Infrastructure & Ops',
  'Network Operations',
  'Enterprise Storage',
  'Product Design',
  'Data Science',
  'Operations',
  'Legal',
];

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const isEditMode = !!initialData;

  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetType, setAssetType] = useState('Laptop');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAssetTag(initialData.assetTag || '');
      setSerialNumber(initialData.serialNumber || '');
      setAssetType(initialData.assetType || 'Laptop');
      setBrand(initialData.brand || '');
      setModel(initialData.model || '');
      setDepartment(initialData.department || 'Engineering');
      setPurchaseDate(
        initialData.purchaseDate
          ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
          : ''
      );
    } else {
      setAssetTag('');
      setSerialNumber('');
      setAssetType('Laptop');
      setBrand('');
      setModel('');
      setDepartment('Engineering');
      setPurchaseDate('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTag.trim() || !serialNumber.trim() || !assetType.trim()) {
      setError('Asset Tag, Serial Number, and Asset Type are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: CreateAssetDto | UpdateAssetDto = {
        assetTag: assetTag.trim().toUpperCase(),
        serialNumber: serialNumber.trim().toUpperCase(),
        assetType: assetType.trim(),
        brand: brand.trim(),
        model: model.trim(),
        department: department.trim(),
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
      };

      if (isEditMode && initialData) {
        const response = await assetService.updateAsset(initialData.id, payload);
        if (response.success && response.data?.asset) {
          onSuccess(response.data.asset);
          onClose();
        }
      } else {
        const response = await assetService.createAsset(payload as CreateAssetDto);
        if (response.success && response.data?.asset) {
          onSuccess(response.data.asset);
          onClose();
        }
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to save asset. Please check the fields and try again.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              {isEditMode ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {isEditMode ? 'Edit Hardware Asset' : 'Register New Asset'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? 'Update hardware details and specifications'
                  : 'Add a new hardware device to the IT asset inventory'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Asset Tag */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asset Tag <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
                placeholder="e.g. AST-2024-001"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SN-DELL-LAT-001"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Asset Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asset Type <span className="text-red-500">*</span>
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {COMMON_ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {COMMON_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Dell, Apple, Cisco"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Name / Spec
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Latitude 7420 vPro"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Update Asset' : 'Register Asset'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
