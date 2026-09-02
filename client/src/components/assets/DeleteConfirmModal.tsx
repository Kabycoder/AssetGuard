import React, { useState } from 'react';
import { AlertTriangle, Loader2, X, AlertCircle, Trash2 } from 'lucide-react';
import { Asset } from '../../types';
import { assetService } from '../../services/assetService';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: (deletedAssetId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      const response = await assetService.deleteAsset(asset.id);
      if (response.success) {
        onSuccess(asset.id);
        onClose();
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete asset. An error occurred.';
      setError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Delete Asset</h3>
              <p className="text-xs text-slate-500">Confirm permanent asset removal</p>
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="space-y-1">
                <span className="font-semibold block">Action Blocked</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-xl text-amber-800 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-900 mb-0.5">Warning: This action cannot be undone.</span>
              Are you sure you want to permanently delete asset <strong className="font-mono text-slate-900">{asset.assetTag}</strong> ({asset.brand} {asset.model})?
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60 text-xs space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Asset Tag:</span>
              <span className="font-mono font-semibold text-slate-800">{asset.assetTag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Serial Number:</span>
              <span className="font-mono text-slate-800">{asset.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="text-slate-800">{asset.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lifecycle Status:</span>
              <span className="font-medium text-slate-800">{asset.status}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-400 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
