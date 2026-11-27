import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Clock, Copy, Printer, ShieldCheck, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../common/StatusBadge';
import { Button } from '../common/Controls';
import { formatDate, formatDateTime, formatTimeOnly } from '../../utils/formatters';

export default function CouponTicket({ coupon, compact = false }) {
  if (!coupon) return null;

  // QR code carries only couponId + verificationToken (no student PII)
  const qrPayload = JSON.stringify({
    couponId: coupon.couponId,
    token: coupon.verificationToken,
  });

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(coupon.couponId);
      toast.success('Coupon ID copied to clipboard');
    } catch {
      toast.error('Unable to copy coupon ID');
    }
  };

  return (
    <div className="printable-coupon overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Top Emerald Pass Header */}
      <div className="bg-[#064E3B] px-6 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-200">
                MessMate Digital Pass
              </p>
              <h3 className="font-display text-base font-bold text-white">
                {coupon.mealType || 'Lunch'} Coupon
              </h3>
            </div>
          </div>
          <StatusBadge status={coupon.status} size="md" />
        </div>
      </div>

      {/* Main Pass Content */}
      <div className={`grid gap-6 p-6 ${compact ? 'md:grid-cols-[1fr_auto]' : 'lg:grid-cols-[1fr_240px]'}`}>
        <div className="flex flex-col justify-between space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Coupon Identifier
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-mono-code rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-lg font-semibold tracking-wide text-slate-900">
                {coupon.couponId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-3">
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <Calendar className="h-3 w-3" /> Date
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatDate(coupon.couponDate)}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <Clock className="h-3 w-3" /> Generated
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatTimeOnly(coupon.generatedAt)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <ShieldCheck className="h-3 w-3" /> Valid Until
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatTimeOnly(coupon.expiresAt)}
              </p>
            </div>
          </div>

          {coupon.student && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Student: </span>
                <span className="font-semibold text-slate-800">{coupon.student.name}</span>
                {coupon.student.studentId && (
                  <span className="ml-2 font-mono-code rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                    {coupon.student.studentId}
                  </span>
                )}
              </div>
              {coupon.redeemedAt && (
                <div>
                  <span className="text-slate-400">Redeemed: </span>
                  <span className="font-medium text-slate-700">
                    {formatDateTime(coupon.redeemedAt)}
                  </span>
                </div>
              )}
            </div>
          )}

          {!compact && (
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" />
                Print Coupon Pass
              </Button>
            </div>
          )}
        </div>

        {/* QR Code Box */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <QRCodeSVG
              value={qrPayload}
              size={compact ? 148 : 176}
              level="M"
              fgColor="#0F172A"
              bgColor="#FFFFFF"
            />
          </div>
          <p className="mt-2.5 text-center text-[11px] font-medium text-slate-500">
            Scan at mess counter to verify
          </p>
        </div>
      </div>
    </div>
  );
}
