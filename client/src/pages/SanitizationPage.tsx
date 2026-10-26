import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Play,
  CheckCircle2,
  AlertTriangle,
  History,
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
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Asset, PaginationMeta, SanitizationQueryParams } from '../types';
import { sanitizationService } from '../services/sanitizationService';
import { CompleteWipingModal } from '../components/sanitization/CompleteWipingModal';
import { FailWipingModal } from '../components/sanitization/FailWipingModal';
import { SanitizationHistoryModal } from '../components/sanitization/SanitizationHistoryModal';

const ASSET_STATUS_CONFIG: Record<
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
    label: 'Disposed',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
};

const WIPING_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500 animate-pulse',
  },
  COMPLETED: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Failed',
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

export const SanitizationPage: React.FC = () => {
  const { user } = useAuth();
  const isItOfficer = user?.role === 'IT_OFFICER';

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
  const [startingAssetId, setStartingAssetId] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wipingStatusFilter, setWipingStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [completeModalAsset, setCompleteModalAsset] = useState<
    (Asset & { activeWipingRecord?: any }) | null
  >(null);
  const [failModalAsset, setFailModalAsset] = useState<Asset | null>(null);
  const [historyModalAssetId, setHistoryModalAssetId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Sanitization Queue
  const fetchSanitizationQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: SanitizationQueryParams = {
        page: currentPage,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        wipingStatus: wipingStatusFilter || undefined,
        assetType: typeFilter || undefined,
        department: departmentFilter || undefined,
      };

      const response = await sanitizationService.getQueue(params);
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
          'Failed to fetch sanitization queue.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, wipingStatusFilter, typeFilter, departmentFilter]);

  useEffect(() => {
    fetchSanitizationQueue();
  }, [fetchSanitizationQueue]);

  // Quick Start Wiping Action for IT Officers
  const handleStartWiping = async (asset: Asset) => {
    try {
      setStartingAssetId(asset.id);
      setError(null);
      setActionSuccessMessage(null);

      const response = await sanitizationService.startWiping(asset.id, {
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
        wipingTool: 'Blancco Drive Eraser',
        remarks: 'Wiping operation initialized by IT technician.',
      });

      if (response.success) {
        setActionSuccessMessage(`Wiping initiated for asset ${asset.assetTag}.`);
        fetchSanitizationQueue();
        setTimeout(() => setActionSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to start wiping job.'
      );
    } finally {
      setStartingAssetId(null);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setWipingStatusFilter('');
    setTypeFilter('');
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    !!search || !!statusFilter || !!wipingStatusFilter || !!typeFilter || !!departmentFilter;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Data Sanitization & Wiping
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              NIST 800-88 / DoD 5220.22-M
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Execute cryptographic erasure, multi-pass overwrites, and audit trails for decommissioned hardware
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
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
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tag, serial, model, brand, department..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Asset Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Asset Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="WIPING_PENDING">Wiping Pending</option>
              <option value="WIPING_IN_PROGRESS">Wiping Active</option>
              <option value="WIPING_COMPLETED">Wiped</option>
            </select>
          </div>

          {/* Wiping Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={wipingStatusFilter}
              onChange={(e) => {
                setWipingStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Wiping Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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

      {/* Sanitization Queue Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Loading Indicator */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            <span className="text-xs font-medium text-slate-500">
              Loading sanitization queue...
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
            <button
              type="button"
              onClick={fetchSanitizationQueue}
              className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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
              No assets in sanitization queue
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? 'No hardware assets matched your sanitization filter criteria.'
                : 'All decommissioned hardware has been processed.'}
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
                  <th className="py-3 px-4">Asset Status</th>
                  <th className="py-3 px-4">Wiping Status</th>
                  <th className="py-3 px-4">Started</th>
                  <th className="py-3 px-4">Completed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {assets.map((asset) => {
                  const assetStatusInfo =
                    ASSET_STATUS_CONFIG[asset.status] || ASSET_STATUS_CONFIG.REGISTERED;

                  const activeRecord =
                    asset.activeWipingRecord || asset.wipingRecords?.[0];
                  const wipingStatusKey = activeRecord
                    ? activeRecord.status
                    : asset.status === 'WIPING_IN_PROGRESS'
                    ? 'IN_PROGRESS'
                    : 'PENDING';
                  const wipingStatusInfo =
                    WIPING_STATUS_CONFIG[wipingStatusKey] || WIPING_STATUS_CONFIG.PENDING;

                  const isEligibleToStart =
                    asset.status === 'REGISTERED' || asset.status === 'WIPING_PENDING';
                  const isInProgress = asset.status === 'WIPING_IN_PROGRESS';
                  const isStartingThis = startingAssetId === asset.id;

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Asset Tag & Serial */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
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
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {asset.model || '—'}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600">
                        {asset.department || '—'}
                      </td>

                      {/* Asset Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${assetStatusInfo.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${assetStatusInfo.dotClass}`}
                          />
                          {assetStatusInfo.label}
                        </span>
                      </td>

                      {/* Wiping Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${wipingStatusInfo.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${wipingStatusInfo.dotClass}`}
                          />
                          {wipingStatusInfo.label}
                        </span>
                      </td>

                      {/* Started */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {activeRecord?.startedAt ? (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(activeRecord.startedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Completed */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {activeRecord?.completedAt ? (
                          <div className="flex items-center gap-1 text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>
                              {new Date(activeRecord.completedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* IT_OFFICER Actions */}
                          {isItOfficer && isEligibleToStart && (
                            <button
                              type="button"
                              onClick={() => handleStartWiping(asset)}
                              disabled={isStartingThis}
                              title="Start Sanitization Wiping Job"
                              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isStartingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                              <span>Start Wipe</span>
                            </button>
                          )}

                          {isItOfficer && isInProgress && (
                            <>
                              <button
                                type="button"
                                onClick={() => setCompleteModalAsset(asset)}
                                title="Complete Wiping with Standard & Tool Specs"
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFailModalAsset(asset)}
                                title="Record Sanitization Failure & Diagnostics"
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 rounded-lg text-xs font-medium transition-all cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                <span>Fail</span>
                              </button>
                            </>
                          )}

                          {/* Sanitization History Button */}
                          <button
                            type="button"
                            onClick={() => setHistoryModalAssetId(asset.id)}
                            title="View Sanitization Audit Trail"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <History className="w-4 h-4" />
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
                        ? 'bg-indigo-600 text-white shadow-sm'
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
      <CompleteWipingModal
        isOpen={!!completeModalAsset}
        asset={completeModalAsset}
        onClose={() => setCompleteModalAsset(null)}
        onSuccess={() => {
          setActionSuccessMessage(
            `Data wiping completed for asset ${completeModalAsset?.assetTag}. Asset is now WIPING_COMPLETED and pending Phase 6 Verification.`
          );
          fetchSanitizationQueue();
          setTimeout(() => setActionSuccessMessage(null), 5000);
        }}
      />

      <FailWipingModal
        isOpen={!!failModalAsset}
        asset={failModalAsset}
        onClose={() => setFailModalAsset(null)}
        onSuccess={() => {
          setActionSuccessMessage(
            `Sanitization marked as FAILED for ${failModalAsset?.assetTag}. Asset returned to WIPING_PENDING.`
          );
          fetchSanitizationQueue();
          setTimeout(() => setActionSuccessMessage(null), 5000);
        }}
      />

      <SanitizationHistoryModal
        isOpen={!!historyModalAssetId}
        assetId={historyModalAssetId}
        onClose={() => setHistoryModalAssetId(null)}
      />
    </div>
  );
};
