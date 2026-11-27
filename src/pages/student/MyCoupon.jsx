import { useCallback, useEffect, useState } from 'react';
import { Ticket, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '../../services/couponService';
import { Card, EmptyState, Skeleton } from '../../components/common/Card';
import { Button } from '../../components/common/Controls';
import CouponTicket from '../../components/coupons/CouponTicket';
import { extractErrorMessage, formatDate } from '../../utils/formatters';

export default function MyCoupon() {
  const [coupon, setCoupon] = useState(null);
  const [today, setToday] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadCoupon = useCallback(async () => {
    try {
      const res = await couponService.getTodayCoupon();
      setCoupon(res.coupon);
      setToday(res.today);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch today’s coupon'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadCoupon);
  }, [loadCoupon]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await couponService.generateTodayCoupon();
      setCoupon(res.coupon);
      toast.success(`Coupon ${res.coupon.couponId} is ready!`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not generate coupon'));
      await loadCoupon();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">My Lunch Coupon</h1>
          <p className="mt-1 text-sm text-slate-500">
            Digital pass for {formatDate(today || new Date())}. Show the QR code at the mess counter.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadCoupon}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Status
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-80 w-full" />
      ) : coupon ? (
        <div className="space-y-4">
          <CouponTicket coupon={coupon} />
          <Card padding="p-4" className="bg-slate-50/70">
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
              <p>
                <strong>Verification Notice:</strong> Only an authorized mess administrator can
                redeem this coupon. Once scanned and confirmed, the pass becomes locked and cannot
                be reused.
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Ticket}
            title="No lunch coupon generated for today"
            description="Generate your daily lunch coupon now to receive your unique QR pass."
            action={
              <Button loading={generating} onClick={handleGenerate}>
                <Ticket className="h-4 w-4" />
                Generate Lunch Coupon
              </Button>
            }
          />
        </Card>
      )}
    </div>
  );
}
