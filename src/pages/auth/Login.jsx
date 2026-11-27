import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, UtensilsCrossed, ShieldCheck, QrCode, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Controls';
import { extractErrorMessage } from '../../utils/formatters';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(`Welcome back, ${user.name}`);
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Unable to sign in. Please check your credentials.');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#F8FAFC] lg:grid-cols-2">
      {/* Left Brand Panel */}
      <div className="hidden flex-col justify-between bg-[#064E3B] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">MessMate</span>
        </div>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/80 bg-emerald-900/50 px-3 py-1 text-xs font-medium text-emerald-200">
            Smart Digital Lunch Coupon System
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
            Paperless campus dining, verified in seconds.
          </h1>
          <p className="text-sm leading-relaxed text-emerald-100/80">
            Generate tamper-resistant daily lunch coupons, inspect today&apos;s mess menu, and verify
            QR passes at the counter with real-time duplicate protection.
          </p>

          <div className="grid gap-4 pt-2">
            {[
              {
                icon: QrCode,
                title: 'Cryptographic QR Passes',
                desc: 'Unique daily coupon IDs backed by server-side HMAC tokens.',
              },
              {
                icon: ShieldCheck,
                title: 'Zero Duplicate Redemptions',
                desc: 'Atomic database validation prevents double claims and reuse.',
              },
              {
                icon: Clock,
                title: 'Live Mess Operations',
                desc: 'Instant attendance insights, student lookup, and menu publishing.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-emerald-800/70 bg-emerald-950/30 p-3.5"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-emerald-100/70">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-emerald-200/60">
          MessMate Campus Dining Platform &bull; Role-based Student &amp; Admin Access
        </p>
      </div>

      {/* Right Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#059669] text-white">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold text-slate-900">MessMate</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">
                Access your student coupon portal or mess administrator console.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@college.edu"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" loading={submitting} className="w-full" size="lg">
                Sign in to MessMate
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              New student?{' '}
              <Link to="/register" className="font-semibold text-[#059669] hover:text-[#064E3B]">
                Create your student account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
