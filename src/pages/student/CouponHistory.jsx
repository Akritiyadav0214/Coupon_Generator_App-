import { useCallback, useEffect, useState } from 'react';
import { History, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '../../services/couponService';
import { useDebounce } from '../../hooks/useDebounce';
import { Card, EmptyState, Skeleton } from '../../components/common/Card';
import { Modal, Pagination } from '../../components/common/Controls';
import StatusBadge from '../../components/common/StatusBadge';
import CouponTicket from '../../components/coupons/CouponTicket';
import { extractErrorMessage, formatDate, formatDateTime } from '../../utils/formatters';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'REDEEMED', label: 'Redeemed' },
  { key: 'EXPIRED', label: 'Expired' },
];

export default function CouponHistory() {
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await couponService.getHistory({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: 10,
      });
      setCoupons(data.coupons || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to load coupon history'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page]);

  useEffect(() => {
    Promise.resolve().then(fetchHistory);
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Coupon History</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete record of your generated lunch coupons and redemption timestamps.
        </p>
      </div>

      <Card padding="p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key || 'ALL'}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Coupon ID */}
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Coupon ID (MM-...)"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={History}
            title="No coupons found"
            description="Try adjusting your status filter or search query."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pr-4">Coupon ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Meal</th>
                    <th className="px-4 py-3">Generated Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="py-3 pl-4 text-right">Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70">
                      <td className="font-mono-code py-3.5 pr-4 text-xs font-semibold text-slate-900">
                        {c.couponId}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {formatDate(c.couponDate)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                        {c.mealType}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {formatDateTime(c.generatedAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCoupon(c)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(selectedCoupon)}
        onClose={() => setSelectedCoupon(null)}
        title="Coupon Pass Details"
        subtitle={selectedCoupon?.couponId}
        maxWidth="max-w-2xl"
      >
        {selectedCoupon && <CouponTicket coupon={selectedCoupon} compact />}
      </Modal>
    </div>
  );
}
