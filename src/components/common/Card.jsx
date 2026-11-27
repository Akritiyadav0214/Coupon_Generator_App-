export function Card({ children, className = '', padding = 'p-6' }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${padding} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, accent = 'emerald' }) {
  const accentStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dark: 'bg-[#064E3B] text-white border-[#064E3B]',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <Card className="transition-all duration-150 hover:border-slate-300 hover:shadow-sm" padding="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
              accentStyles[accent] || accentStyles.emerald
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs font-medium text-slate-600">
          {trend}
        </div>
      )}
    </Card>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-xs">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Unable to load data', description, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-lg text-sm text-red-700">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}
