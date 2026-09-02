import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building,
  Barcode,
  Layers,
  Clock,
  ShieldCheck,
  Trash2,
  Edit2,
  Loader2,
  Laptop,
  Server,
  HardDrive,
  Cpu,
  ShieldAlert,
  Boxes,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Asset } from '../types';
import { assetService } from '../services/assetService';
import { AssetFormModal } from '../components/assets/AssetFormModal';
import { DeleteConfirmModal } from '../components/assets/DeleteConfirmModal';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  REGISTERED: {
    label: 'Registered',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
  WIPING_PENDING: {
    label: 'Wiping Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  WIPING_IN_PROGRESS: {
    label: 'Wiping Active',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  WIPING_COMPLETED: {
    label: 'Wiped (Pending Verification)',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  VERIFIED: {
    label: 'Verified Clean',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  DISPOSED: {
    label: 'Disposed / Recycled',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
};

const ASSET_TYPE_ICONS: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="w-5 h-5 text-indigo-600" />,
  Workstation: <Cpu className="w-5 h-5 text-blue-600" />,
  'Rack Server': <Server className="w-5 h-5 text-violet-600" />,
  'SAN Storage Array': <HardDrive className="w-5 h-5 text-emerald-600" />,
  'Enterprise Switch': <Server className="w-5 h-5 text-teal-600" />,
  'Firewall Appliance': <ShieldAlert className="w-5 h-5 text-amber-600" />,
};

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchAssetDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await assetService.getAssetById(id);
      if (response.success && response.data?.asset) {
        setAsset(response.data.asset);
      } else {
        setError('Asset details not found.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load asset details.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssetDetails();
  }, [fetchAssetDetails]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500">
          Loading hardware details...
        </span>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Asset Not Found
        </h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'Asset ID does not exist.'}</p>
        <button
          type="button"
          onClick={() => navigate('/assets')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          Back to Asset Inventory
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[asset.status] || STATUS_CONFIG.REGISTERED;

  const wipingRecords = asset.wipingRecords || [];
  const disposalRecords = asset.disposalRecords || [];
  const hasHistory = wipingRecords.length > 0 || disposalRecords.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/assets')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assets</span>
        </button>

        {isAdmin && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Asset</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Asset Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              {ASSET_TYPE_ICONS[asset.assetType] || <Boxes className="w-6 h-6 text-indigo-600" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 font-mono">
                  {asset.assetTag}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {asset.brand} {asset.model} • <span className="font-medium text-slate-800">{asset.assetType}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 pt-6 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Barcode className="w-3.5 h-3.5 text-slate-400" />
              <span>Serial Number</span>
            </div>
            <div className="font-mono font-semibold text-slate-800 text-sm">
              {asset.serialNumber}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Department</span>
            </div>
            <div className="font-medium text-slate-800 text-sm">
              {asset.department || '—'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Purchase Date</span>
            </div>
            <div className="text-slate-800 text-sm">
              {asset.purchaseDate
                ? new Date(asset.purchaseDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>System Registered</span>
            </div>
            <div className="text-slate-800 text-sm">
              {new Date(asset.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle & Compliance History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-800">
              Lifecycle & Compliance Audit Trail
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            NIST SP 800-88 / DoD 5220.22-M
          </span>
        </div>

        {!hasHistory ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-700 mb-0.5">
              No Workflow Records Yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              This asset is currently in the <span className="font-semibold text-slate-600">REGISTERED</span> status. Data sanitization and verification jobs will be tracked here in future lifecycle phases.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Wiping Records */}
            {wipingRecords.map((wiping) => (
              <div
                key={wiping.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      Data Sanitization Job
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
                      {wiping.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(wiping.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Method:</span>
                    <span className="font-medium text-slate-700">{wiping.wipingMethod}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tool:</span>
                    <span className="font-medium text-slate-700">{wiping.wipingTool}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Verification:</span>
                    <span className="font-semibold text-emerald-600">{wiping.verificationStatus}</span>
                  </div>
                </div>

                {wiping.remarks && (
                  <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-100">
                    "{wiping.remarks}"
                  </p>
                )}
              </div>
            ))}

            {/* Disposal Records */}
            {disposalRecords.map((disp) => (
              <div
                key={disp.id}
                className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      Final Certified Disposal / Recycling
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                      {disp.disposalMethod}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(disp.disposedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Certified Vendor:</span>
                    <span className="font-medium text-slate-800">{disp.vendorName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Certificate #:</span>
                    <span className="font-mono font-semibold text-purple-800">{disp.certificateNumber || '—'}</span>
                  </div>
                </div>

                {disp.remarks && (
                  <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-purple-100">
                    "{disp.remarks}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AssetFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => {
          setAsset(updated);
        }}
        initialData={asset}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        asset={asset}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          navigate('/assets');
        }}
      />
    </div>
  );
};
