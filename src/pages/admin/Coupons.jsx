import { useCallback, useEffect, useState } from 'react';
import { Search, Ticket, Eye, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { couponService } from '../../services/couponService';
import { useDebounce } from '../../hooks/useDebounce';
import { Card, EmptyState, Skeleton } from '../../components/common/Card';
import { Button, Modal, Pagination } from '../../components/common/Controls';
import StatusBadge from '../../components/common/StatusBadge';
import { extractErrorMessage, formatDate, formatDateTime } from '../../utils/formatters';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      const data = await adminService.getCoupons({
        search: debouncedSearch || undefined,
        status: status || undefined,
        date: date || undefined,
        page,
        limit: 12,
      });
      setCoupons(data.coupons || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to load coupons'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, date, page]);

  useEffect(() => {
    Promise.resolve().then(fetchCoupons);
  }, [fetchCoupons]);

  const handleQuickRedeem = async (coupon) => {
    try {
      setRedeeming(true);
      const res = await couponService.redeemCoupon({
        couponId: coupon.couponId,
        verificationToken: coupon.verificationToken,
      });
      toast.success(`Coupon ${coupon.couponId} redeemed`);
      setSelected(res.data.coupon);
      await fetchCoupons();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Redemption failed'));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Coupon Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inspect all issued lunch coupons, filter by date or status, and audit redemptions.
        </p>
      </div>

      <Card padding="p-5">
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Coupon ID, student name, or roll number..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#059669] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="REDEEMED">Redeemed</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#059669] focus:outline-none"
            />
            {date && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDate('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
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
            icon={Ticket}
            title="No coupons found"
            description="Adjust your filters to inspect other dates or coupon statuses."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pr-4">Coupon ID</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Meal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="py-3 pl-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70">
                      <td className="font-mono-code py-3.5 pr-4 text-xs font-semibold text-slate-900">
                        {c.couponId}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-slate-900">{c.student?.name}</p>
                        <p className="font-mono-code text-[11px] text-slate-500">
                          {c.student?.studentId}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {formatDate(c.couponDate)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700">{c.mealType}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Button variant="secondary" size="sm" onClick={() => setSelected(c)}>
                          <Eye className="h-3.5 w-3.5" />
                          Inspect
                        </Button>
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
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Coupon Audit Details"
        subtitle={selected?.couponId}
      >
        {selected && (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
              <div className="flex justify-between px-4 py-3">
                <span className="text-slate-500">Student</span>
                <span className="font-semibold text-slate-900">
                  {selected.student?.name} ({selected.student?.studentId})
                </span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-slate-500">Generated At</span>
                <span className="font-medium text-slate-800">
                  {formatDateTime(selected.generatedAt)}
                </span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-slate-500">Expires At</span>
                <span className="font-medium text-slate-800">
                  {formatDateTime(selected.expiresAt)}
                </span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-slate-500">Redeemed At</span>
                <span className="font-medium text-slate-800">
                  {selected.redeemedAt ? formatDateTime(selected.redeemedAt) : 'Not redeemed'}
                </span>
              </div>
              {selected.redeemedBy && (
                <div className="flex justify-between px-4 py-3">
                  <span className="text-slate-500">Redeemed By</span>
                  <span className="font-medium text-slate-800">{selected.redeemedBy.name}</span>
                </div>
              )}
            </div>

            {selected.status === 'ACTIVE' && (
              <Button
                className="w-full"
                loading={redeeming}
                onClick={() => handleQuickRedeem(selected)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Redeem Coupon Now
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
