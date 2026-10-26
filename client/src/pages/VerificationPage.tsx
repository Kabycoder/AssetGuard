import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Boxes,
  Loader2,
  Laptop,
  Server,
  HardDrive,
  Cpu,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Asset, PaginationMeta, VerificationQueryParams } from '../types';
import { verificationService } from '../services/verificationService';
import { VerifyAssetModal } from '../components/verification/VerifyAssetModal';
import { RejectVerificationModal } from '../components/verification/RejectVerificationModal';
import { VerificationDetailModal } from '../components/verification/VerificationDetailModal';

const VERIFICATION_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING: {
    label: 'Pending Verification',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  VERIFIED: {
    label: 'Verified Clean',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected (Needs Re-wipe)',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
};

const ASSET_TYPE_ICONS: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="w-3.5 h-3.5 text-indigo-500" />,
  Workstation: <Cpu className="w-3.5 h-3.5 text-blue-500" />,
  'Rack Server': <Server className="w-3.5 h-3.5 text-violet-500" />,
  'SAN Storage Array': <HardDrive className="w-3.5 h-3.5 text-emerald-500" />,
  'Enterprise Switch': <Server className="w-3.5 h-3.5 text-teal-500" />,
  'Firewall Appliance': <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />,
};

const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'Human Resources',
  'Information Security',
  'Infrastructure & Ops',
  'Network Operations',
  'Enterprise Storage',
  'Data Science',
  'Product Design',
  'Operations',
  'Legal',
];

const ASSET_TYPES = [
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

export const VerificationPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [assets, setAssets] = useState<(Asset & { activeWipingRecord?: any })[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [verifyModalAsset, setVerifyModalAsset] = useState<
    (Asset & { activeWipingRecord?: any }) | null
  >(null);
  const [rejectModalAsset, setRejectModalAsset] = useState<Asset | null>(null);
  const [detailModalAssetId, setDetailModalAssetId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Verification Queue
  const fetchVerificationQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: VerificationQueryParams = {
        page: currentPage,
        limit: 10,
        search: debouncedSearch || undefined,
        verificationStatus: verificationStatusFilter || undefined,
        assetType: typeFilter || undefined,
        department: departmentFilter || undefined,
      };

      const response = await verificationService.getQueue(params);
      if (response.success && response.data) {
        setAssets(response.data.assets);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to fetch verification audit queue.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, verificationStatusFilter, typeFilter, departmentFilter]);

  useEffect(() => {
    fetchVerificationQueue();
  }, [fetchVerificationQueue]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setVerificationStatusFilter('');
    setTypeFilter('');
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    !!search || !!verificationStatusFilter || !!typeFilter || !!departmentFilter;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Sanitization Verification & Audit
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Admin Compliance Authorization
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit sample sector wipes, verify compliance against NIST SP 800-88, and issue verified disposal clearances
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Role: <strong className="text-slate-900">{user?.role || 'User'}</strong></span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tag, serial, model, brand, department..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Verification Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={verificationStatusFilter}
              onChange={(e) => {
                setVerificationStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Verification Statuses</option>
              <option value="PENDING">Pending Admin Audit</option>
              <option value="VERIFIED">Verified Clean</option>
              <option value="REJECTED">Rejected (Requires Re-wipe)</option>
            </select>
          </div>

          {/* Asset Type Filter */}
          <div className="lg:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Asset Types</option>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="lg:col-span-1">
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Dept</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="lg:col-span-1 flex items-center">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset all filters"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="lg:hidden">Reset</span>
              </button>
            ) : (
              <div className="hidden lg:flex items-center justify-center w-full text-slate-300">
                <Filter className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Queue Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Loading Indicator */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <span className="text-xs font-medium text-slate-500">
              Loading verification queue...
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
            <button
              type="button"
              onClick={fetchVerificationQueue}
              className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : assets.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              No assets in verification queue
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? 'No hardware assets matched your verification filter criteria.'
                : 'No wiped assets currently awaiting administrator verification.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Asset Type</th>
                  <th className="py-3 px-4">Brand / Model</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Sanitization Method</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Wiped At</th>
                  <th className="py-3 px-4">Audit Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {assets.map((asset) => {
                  const activeRecord =
                    asset.activeWipingRecord || asset.wipingRecords?.[0];
                  const verificationStatusKey =
                    activeRecord?.verificationStatus || 'PENDING';
                  const verificationStatusInfo =
                    VERIFICATION_STATUS_CONFIG[verificationStatusKey] ||
                    VERIFICATION_STATUS_CONFIG.PENDING;

                  const isPendingAdminVerification =
                    asset.status === 'WIPING_COMPLETED' &&
                    verificationStatusKey === 'PENDING';

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Asset Tag & Serial */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {asset.assetTag}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {asset.serialNumber}
                        </div>
                      </td>

                      {/* Asset Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          {ASSET_TYPE_ICONS[asset.assetType] || (
                            <Boxes className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{asset.assetType}</span>
                        </div>
                      </td>

                      {/* Brand & Model */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {asset.brand || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {asset.model || '—'}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600">
                        {asset.department || '—'}
                      </td>

                      {/* Sanitization Method */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[180px]">
                          {activeRecord?.wipingMethod || 'NIST SP 800-88 Purge'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {activeRecord?.wipingTool || 'Blancco Eraser'}
                        </div>
                      </td>

                      {/* Technician */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[110px]">
                            {activeRecord?.technician?.name || 'IT Officer'}
                          </span>
                        </div>
                      </td>

                      {/* Wiped At */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {activeRecord?.completedAt ? (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(activeRecord.completedAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Audit Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${verificationStatusInfo.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${verificationStatusInfo.dotClass}`}
                          />
                          {verificationStatusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Admin Verification Actions */}
                          {isAdmin && isPendingAdminVerification && (
                            <>
                              <button
                                type="button"
                                onClick={() => setVerifyModalAsset(asset)}
                                title="Approve & Verify Sanitization Compliance"
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setRejectModalAsset(asset)}
                                title="Reject Sanitization & Require Re-wipe"
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 rounded-lg text-xs font-medium transition-all cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* Audit Detail Button */}
                          <button
                            type="button"
                            onClick={() => setDetailModalAssetId(asset.id)}
                            title="View Verification Details & Audit Certificate"
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && assets.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{pagination.total}</span>{' '}
              assets
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      pagination.page === pageNum
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <VerifyAssetModal
        isOpen={!!verifyModalAsset}
        asset={verifyModalAsset}
        onClose={() => setVerifyModalAsset(null)}
        onSuccess={() => {
          setActionSuccessMessage(
            `Asset ${verifyModalAsset?.assetTag} successfully audited & verified. Asset status is now VERIFIED and ready for disposal.`
          );
          fetchVerificationQueue();
          setTimeout(() => setActionSuccessMessage(null), 5000);
        }}
      />

      <RejectVerificationModal
        isOpen={!!rejectModalAsset}
        asset={rejectModalAsset}
        onClose={() => setRejectModalAsset(null)}
        onSuccess={() => {
          setActionSuccessMessage(
            `Sanitization rejected for ${rejectModalAsset?.assetTag}. Asset reset to WIPING_PENDING for re-sanitization.`
          );
          fetchVerificationQueue();
          setTimeout(() => setActionSuccessMessage(null), 5000);
        }}
      />

      <VerificationDetailModal
        isOpen={!!detailModalAssetId}
        assetId={detailModalAssetId}
        onClose={() => setDetailModalAssetId(null)}
      />
    </div>
  );
};
