import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Boxes,
  Loader2,
  Laptop,
  Server,
  HardDrive,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Asset, AssetQueryParams, PaginationMeta } from '../types';
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

export const AssetsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<Asset | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssetForDelete, setSelectedAssetForDelete] = useState<Asset | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Assets
  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: AssetQueryParams = {
        page: currentPage,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        assetType: typeFilter || undefined,
        department: departmentFilter || undefined,
      };

      const response = await assetService.getAssets(params);
      if (response.success && response.data) {
        setAssets(response.data.assets);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to fetch asset inventory.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, typeFilter, departmentFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    !!search || !!statusFilter || !!typeFilter || !!departmentFilter;

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setSelectedAssetForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
    setSelectedAssetForEdit(asset);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (asset: Asset) => {
    setSelectedAssetForDelete(asset);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = () => {
    fetchAssets();
  };

  const handleDeleteSuccess = () => {
    fetchAssets();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Asset Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, track, and register hardware assets across lifecycle stages
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        )}
      </div>

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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="WIPING_PENDING">Wiping Pending</option>
              <option value="WIPING_IN_PROGRESS">Wiping Active</option>
              <option value="WIPING_COMPLETED">Wiped</option>
              <option value="VERIFIED">Verified</option>
              <option value="DISPOSED">Disposed</option>
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
          <div className="lg:col-span-2">
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Departments</option>
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

      {/* Asset Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Loading Indicator */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            <span className="text-xs font-medium text-slate-500">
              Loading hardware inventory...
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
            <button
              type="button"
              onClick={fetchAssets}
              className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors"
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
              No assets found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? 'No hardware assets matched your search or active filter criteria.'
                : 'No hardware assets registered yet in the system.'}
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
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Brand / Model</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Purchase Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {assets.map((asset) => {
                  const statusInfo =
                    STATUS_CONFIG[asset.status] || STATUS_CONFIG.REGISTERED;

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

                      {/* Type */}
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
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {asset.model || '—'}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600">
                        {asset.department || '—'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusInfo.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`}
                          />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Purchase Date */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {asset.purchaseDate
                          ? new Date(asset.purchaseDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => navigate(`/assets/${asset.id}`)}
                            title="View Asset Details"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Admin Edit */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(asset)}
                              title="Edit Asset"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Admin Delete */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(asset)}
                              title="Delete Asset"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={selectedAssetForEdit}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        asset={selectedAssetForDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};
