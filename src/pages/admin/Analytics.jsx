import { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, CheckCircle2, Percent, Ticket } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Card, EmptyState, ErrorState, Skeleton, StatCard } from '../../components/common/Card';
import { extractErrorMessage } from '../../utils/formatters';

export default function Analytics() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAnalytics(days);
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    Promise.resolve().then(fetchAnalytics);
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Reports unavailable" description={error} onRetry={fetchAnalytics} />;
  }

  const summary = data?.summary || {};
  const dailySeries = data?.dailySeries || [];
  const departmentStats = data?.departmentStats || [];
  const hourlyDistribution = data?.hourlyDistribution || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Utilization trends, redemption rates, and department participation from MongoDB.
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Coupons Issued"
          value={summary.totalGenerated ?? 0}
          subtitle="All-time coupon generation"
          icon={Ticket}
          accent="emerald"
        />
        <StatCard
          title="Total Meals Redeemed"
          value={summary.totalRedeemed ?? 0}
          subtitle={`${summary.totalExpired ?? 0} expired unclaimed`}
          icon={CheckCircle2}
          accent="dark"
        />
        <StatCard
          title="Redemption Rate"
          value={`${summary.redemptionRate ?? 0}%`}
          subtitle="Redeemed vs generated ratio"
          icon={Percent}
          accent="amber"
        />
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Daily Generation vs Redemption ({days} Days)
          </h2>
          <p className="text-xs text-slate-500">
            Compares daily issued passes against confirmed mess redemptions
          </p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySeries} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="generated" name="Generated" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="redeemed" name="Redeemed" fill="#064E3B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expired" name="Expired" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Department Participation
            </h2>
            <p className="text-xs text-slate-500">Top departments by lunch coupons generated</p>
          </div>
          {departmentStats.length === 0 ? (
            <EmptyState icon={BarChart3} title="No department stats" description="No coupon records yet." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentStats}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={120}
                    tick={{ fontSize: 11, fill: '#334155' }}
                  />
                  <Tooltip />
                  <Bar dataKey="generated" name="Generated" fill="#059669" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="redeemed" name="Redeemed" fill="#064E3B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Peak Redemption Hours
            </h2>
            <p className="text-xs text-slate-500">Hourly distribution of verified counter scans</p>
          </div>
          {hourlyDistribution.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No redemptions recorded"
              description="Hourly peaks appear once coupons are redeemed."
            />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Redemptions"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#064E3B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
