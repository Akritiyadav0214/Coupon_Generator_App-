import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

const STATUS_MAP = {
  ACTIVE: {
    label: 'Active',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: Clock,
  },
  REDEEMED: {
    label: 'Redeemed',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: 'Expired',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    icon: XCircle,
  },
  VALID: {
    label: 'Valid',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  ALREADY_REDEEMED: {
    label: 'Already Redeemed',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
  },
  INVALID: {
    label: 'Invalid',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    icon: XCircle,
  },
  ACTIVE_USER: {
    label: 'Active',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  INACTIVE_USER: {
    label: 'Deactivated',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
};

export default function StatusBadge({ status, showDot = true, size = 'sm' }) {
  const config = STATUS_MAP[status] || {
    label: status || 'Unknown',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClass} ${config.classes}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  );
}
