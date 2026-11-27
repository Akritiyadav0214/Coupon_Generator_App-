const PARTNER_NAME = '[PARTNER NAME]';
const SECTION = '[SECTION]';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/90 px-4 py-5 text-slate-600 sm:px-6 lg:px-8 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-[#064E3B]">
            Developed &amp; Maintained By:{' '}
            <span className="text-slate-900">
              Aditya Kumar &amp; {PARTNER_NAME}
            </span>
          </p>
          <p className="text-slate-500">
            B.Tech CSE – Section {SECTION} &bull;{' '}
            <span className="font-medium text-[#059669]">Full Stack Development Team</span>
          </p>
        </div>

        <div className="text-xs text-slate-500">
          &copy; 2026 <span className="font-medium text-slate-700">ABESEC Ghaziabad</span>. All
          Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
