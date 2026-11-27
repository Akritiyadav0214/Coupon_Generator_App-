import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
  Clock,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { couponService } from '../../services/couponService';
import { Card, EmptyState, Skeleton, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Controls';
import StatusBadge from '../../components/common/StatusBadge';
import CouponTicket from '../../components/coupons/CouponTicket';
import {
  extractErrorMessage,
  formatDate,
  formatDateTime,
  getGreeting,
} from '../../utils/formatters';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await couponService.getDashboard();
      setData(res);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  const handleGenerateCoupon = async () => {
    try {
      setGenerating(true);
      const res = await couponService.generateTodayCoupon();
      toast.success(`Lunch coupon ${res.coupon.couponId} generated!`);
      await loadDashboard();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not generate lunch coupon'));
      if (err.response?.status === 409) {
        await loadDashboard();
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalCoupons: 0,
    redeemedCoupons: 0,
    activeCoupons: 0,
    currentMeal: 'Lunch',
  };
  const todayCoupon = data?.todayCoupon;
  const recentCoupons = data?.recentCoupons || [];
  const todayMenu = data?.todayLunchMenu;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s your mess overview for today ({formatDate(data?.today)}).
          </p>
        </div>
        <Link to="/student/menu">
          <Button variant="secondary" size="md">
            <UtensilsCrossed className="h-4 w-4 text-[#059669]" />
            View Today&apos;s Menu
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Coupons Generated"
          value={stats.totalCoupons}
          subtitle="All-time mess passes"
          icon={Ticket}
          accent="emerald"
        />
        <StatCard
          title="Coupons Redeemed"
          value={stats.redeemedCoupons}
          subtitle="Meals successfully claimed"
          icon={CheckCircle2}
          accent="dark"
        />
        <StatCard
          title="Active Coupons"
          value={stats.activeCoupons}
          subtitle={todayCoupon?.status === 'ACTIVE' ? 'Ready for scanning' : 'No active pass'}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Current Meal"
          value={stats.currentMeal}
          subtitle={
            todayMenu
              ? `${todayMenu.startTime} – ${todayMenu.endTime}`
              : '12:00 – 14:30 standard window'
          }
          icon={UtensilsCrossed}
          accent="slate"
        />
      </div>

      {/* Today's Coupon Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900">Today&apos;s Lunch Coupon</h2>
          {todayCoupon && (
            <Link
              to="/student/coupon"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669] hover:text-[#064E3B]"
            >
              Full pass view <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {todayCoupon ? (
          <CouponTicket coupon={todayCoupon} compact />
        ) : (
          <Card className="border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/40">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Lunch Coupon Available
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900">
                    Ready to claim today&apos;s lunch pass?
                  </h3>
                  <p className="mt-1 max-w-xl text-sm text-slate-600">
                    Each student can generate one unique digital lunch coupon per day. Present the
                    generated QR code at the mess counter during serving hours.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(data?.today)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-slate-400" />
                    Meal: <strong className="text-slate-800">Lunch</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Serving:{' '}
                    <strong className="text-slate-800">
                      {todayMenu ? `${todayMenu.startTime} – ${todayMenu.endTime}` : '12:00 – 14:30'}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Button size="lg" loading={generating} onClick={handleGenerateCoupon}>
                  <Ticket className="h-4 w-4" />
                  Generate Lunch Coupon
                </Button>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Bottom 2-column grid: Recent Activity + Today's Lunch Preview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Recent Coupon Activity
              </h2>
              <p className="text-xs text-slate-500">Your latest generated lunch passes</p>
            </div>
            <Link
              to="/student/history"
              className="text-xs font-semibold text-[#059669] hover:text-[#064E3B]"
            >
              View all
            </Link>
          </div>

          {recentCoupons.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Ticket}
                title="No coupon activity yet"
                description="Generate your first lunch coupon above to start tracking your mess history."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Coupon ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Generated</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCoupons.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="font-mono-code px-6 py-3.5 text-xs font-semibold text-slate-900">
                        {c.couponId}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {formatDate(c.couponDate)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {formatDateTime(c.generatedAt)}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Today&apos;s Lunch Menu
              </h2>
              <p className="text-xs text-slate-500">
                {todayMenu ? `${todayMenu.startTime} – ${todayMenu.endTime}` : 'Daily dining hall'}
              </p>
            </div>
            <UtensilsCrossed className="h-4 w-4 text-[#059669]" />
          </div>

          {todayMenu && todayMenu.items?.length > 0 ? (
            <ul className="space-y-2.5">
              {todayMenu.items.slice(0, 6).map((item) => (
                <li
                  key={item._id || item.name}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.isVeg === false ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-800">{item.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.category}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={UtensilsCrossed}
              title="Menu not published yet"
              description="Check back shortly for today's lunch menu."
            />
          )}

          <Link to="/student/menu" className="mt-4 block">
            <Button variant="secondary" size="sm" className="w-full">
              Explore Full Menu
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
