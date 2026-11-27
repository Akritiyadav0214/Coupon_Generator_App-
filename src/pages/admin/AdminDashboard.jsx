import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminService } from '../../services/adminService';
import { Card, EmptyState, ErrorState, Skeleton, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Controls';
import StatusBadge from '../../components/common/StatusBadge';
import { extractErrorMessage, formatDate, formatRelativeTime } from '../../utils/formatters';

const PIE_COLORS = ['#059669', '#D97706', '#DC2626'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getDashboard();
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load admin overview'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Dashboard unavailable" description={error} onRetry={loadDashboard} />;
  }

  const stats = data?.stats || {};
  const dailyTrend = data?.dailyTrend || [];
  const statusBreakdown = (data?.statusBreakdown || []).filter((s) => s.value > 0);
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Mess Operations Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time coupon generation, redemptions, and student dining metrics for{' '}
            {formatDate(data?.today)}.
          </p>
        </div>

        <div className="flex gap-2.5">
          <Link to="/admin/menu">
            <Button variant="secondary" size="md">
              Manage Menu
            </Button>
          </Link>
          <Link to="/admin/scanner">
            <Button size="md">
              <QrCode className="h-4 w-4" />
              Open QR Scanner
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 Required Admin Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Registered Students"
          value={stats.totalStudents ?? 0}
          subtitle={`${stats.activeStudents ?? 0} active accounts`}
          icon={Users}
          accent="dark"
        />
        <StatCard
          title="Generated Today"
          value={stats.couponsGeneratedToday ?? 0}
          subtitle="Today's lunch passes"
          icon={Ticket}
          accent="emerald"
        />
        <StatCard
          title="Redeemed Today"
          value={stats.couponsRedeemedToday ?? 0}
          subtitle="Meals served today"
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Pending Coupons"
          value={stats.pendingCouponsToday ?? 0}
          subtitle="Active & unclaimed today"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Expired Coupons"
          value={stats.expiredCouponsTotal ?? 0}
          subtitle="Unclaimed past passes"
          icon={XCircle}
          accent="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                7-Day Coupon Generation &amp; Redemption
              </h2>
              <p className="text-xs text-slate-500">Daily lunch passes generated vs redeemed</p>
            </div>
            <Link
              to="/admin/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669] hover:text-[#064E3B]"
            >
              Deep analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#064E3B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#064E3B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="generated"
                  name="Generated"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#gradGen)"
                />
                <Area
                  type="monotone"
                  dataKey="redeemed"
                  name="Redeemed"
                  stroke="#064E3B"
                  strokeWidth={2}
                  fill="url(#gradRed)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              All-Time Coupon Status
            </h2>
            <p className="text-xs text-slate-500">
              {stats.totalCouponsAllTime ?? 0} total coupons issued
            </p>
          </div>

          {statusBreakdown.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No coupon data yet"
              description="Statistics will populate as students generate coupons."
            />
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {statusBreakdown.map((entry, idx) => (
                        <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid w-full grid-cols-3 gap-2 text-center">
                {data.statusBreakdown.map((item, idx) => (
                  <div key={item.name} className="rounded-lg bg-slate-50 p-2">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      {item.name}
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Recent Coupon Activity
            </h2>
            <p className="text-xs text-slate-500">Latest coupon generations and redemptions</p>
          </div>
          <Link
            to="/admin/coupons"
            className="text-xs font-semibold text-[#059669] hover:text-[#064E3B]"
          >
            All coupons
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Ticket}
              title="No recent activity"
              description="Coupon events will appear here in real time."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Coupon ID</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivity.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70">
                    <td className="font-mono-code px-6 py-3.5 text-xs font-semibold text-slate-900">
                      {item.couponId}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-slate-900">
                        {item.student?.name || 'Unknown'}
                      </p>
                      <p className="font-mono-code text-[11px] text-slate-500">
                        {item.student?.studentId} &bull; {item.student?.department}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {formatDate(item.couponDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right text-xs text-slate-500">
                      {formatRelativeTime(item.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
