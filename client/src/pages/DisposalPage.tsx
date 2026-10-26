import React, { useState, useEffect, useCallback } from 'react';
import {
  Recycle,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  RotateCcw,
  Boxes,
  Loader2,
  Flame,
  DollarSign,
  Gift,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Asset, DisposalRecordSummary, PaginationMeta } from '../types';
import { disposalService } from '../services/disposalService';
import { RecordDisposalModal } from '../components/disposal/RecordDisposalModal';
import { DisposalDetailModal } from '../components/disposal/DisposalDetailModal';

const METHOD_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  RECYCLING: {
    label: 'R2 Recycling',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <Recycle className="w-3.5 h-3.5 text-emerald-600" />,
  },
  PHYSICAL_SHREDDING: {
    label: 'Destruction',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <Flame className="w-3.5 h-3.5 text-rose-600" />,
  },
  RESALE: {
    label: 'Resale',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <DollarSign className="w-3.5 h-3.5 text-blue-600" />,
  },
  DONATION: {
    label: 'Donation',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <Gift className="w-3.5 h-3.5 text-purple-600" />,
  },
};

export const DisposalPage: React.FC = () => {
  const { user } = useAuth();
  const canDispose = user?.role === 'ADMIN' || user?.role === 'DISPOSAL_OFFICER';

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [records, setRecords] = useState<(DisposalRecordSummary & { asset: Asset })[]>([]);
  const [verifiedQueue, setVerifiedQueue] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  // Modals
  const [selectedAssetForDisposal, setSelectedAssetForDisposal] = useState<Asset | null>(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<
    (DisposalRecordSummary & { asset: Asset }) | null
  >(null);

  const fetchDisposalData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await disposalService.getQueue({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        disposalMethod: selectedMethod || undefined,
      });

      if (response.success && response.data) {
        setRecords(response.data.records);
        setVerifiedQueue(response.data.verifiedQueue || []);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        });
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Failed to load disposition records.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedMethod]);

  useEffect(() => {
    fetchDisposalData();
  }, [fetchDisposalData]);

  const handleActionSuccess = (msg: string) => {
    setActionSuccessMessage(msg);
    fetchDisposalData();
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Disposal & Recycling
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              R2 / e-Stewards Certified
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Record the final physical disposal of verified assets and issue Certificates of Destruction.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchDisposalData()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-sm text-rose-800">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3 Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Awaiting Disposition
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {verifiedQueue.length}
            </span>
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Clean Assets
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Completed Certificates (COD)
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {pagination.total}
            </span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Immutable Records
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Certified ITAD Partners
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              4
            </span>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              R2 / e-Stewards Approved
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'queue'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Verified Asset Queue ({verifiedQueue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Disposal History & Certificates ({pagination.total})</span>
        </button>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'queue' ? (
        /* Verified Asset Queue */
        <div className="space-y-4">
          <div className="text-sm text-slate-500">
            Assets verified clean by an administrator and ready for final recycling or shredding:
          </div>

          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading verified asset queue...</p>
            </div>
          ) : verifiedQueue.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Queue is Clear
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No verified assets currently ready for disposal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifiedQueue.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                        {asset.assetTag}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Clean
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        {asset.brand} {asset.model}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Type: {asset.assetType}</span>
                        <span>•</span>
                        <span>Dept: {asset.department}</span>
                        <span>•</span>
                        <span className="font-mono">SN: {asset.serialNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Approved for disposition
                    </span>
                    {canDispose ? (
                      <button
                        type="button"
                        onClick={() => setSelectedAssetForDisposal(asset)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                      >
                        <Recycle className="w-3.5 h-3.5" />
                        <span>Execute Disposition</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Requires Disposal Officer role
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Disposal History & Certificates */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by COD #, vendor, tag, or serial..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Methods</option>
                <option value="RECYCLING">R2 Recycling</option>
                <option value="PHYSICAL_SHREDDING">Physical Shredding</option>
                <option value="RESALE">Resale / Remarket</option>
                <option value="DONATION">Charitable Donation</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading disposition records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center">
                <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-900">No disposal records found</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Certificate #</th>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Certified Partner</th>
                      <th className="px-4 py-3">Disposed Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {records.map((rec) => {
                      const methodCfg =
                        METHOD_CONFIG[rec.disposalMethod] || {
                          label: rec.disposalMethod,
                          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                          icon: <Recycle className="w-3.5 h-3.5" />,
                        };

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-mono font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                              {rec.certificateNumber || 'COD-PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900">
                              {rec.asset?.assetTag}
                            </div>
                            <div className="text-xs text-slate-500">
                              {rec.asset?.brand} {rec.asset?.model}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${methodCfg.badgeClass}`}
                            >
                              {methodCfg.icon}
                              {methodCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">
                            {rec.vendorName || 'Internal'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">
                            {new Date(rec.disposedAt).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedRecordForDetail(rec)}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            >
                              View COD
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing {records.length} of {pagination.total} records
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p: PaginationMeta) => ({ ...p, page: p.page - 1 }))}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-slate-800">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((p: PaginationMeta) => ({ ...p, page: p.page + 1 }))}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Disposal Modal */}
      <RecordDisposalModal
        isOpen={!!selectedAssetForDisposal}
        asset={selectedAssetForDisposal}
        onClose={() => setSelectedAssetForDisposal(null)}
        onSuccess={() => {
          setSelectedAssetForDisposal(null);
          handleActionSuccess('Asset disposition recorded and Certificate of Destruction generated.');
        }}
      />

      {/* Disposal Detail Modal */}
      <DisposalDetailModal
        isOpen={!!selectedRecordForDetail}
        record={selectedRecordForDetail}
        onClose={() => setSelectedRecordForDetail(null)}
      />
    </div>
  );
};
