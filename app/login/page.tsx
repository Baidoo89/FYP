'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type LoginResponse = {
  success: boolean;
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as LoginResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lpads-fade-in bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(29,78,216,0.22),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#102a56_42%,_#0f172a_100%)]">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-amber-300/80 bg-white/98 shadow-[0_30px_100px_rgba(15,23,42,0.35)] backdrop-blur lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative order-2 flex min-h-[220px] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-900 px-5 py-6 text-white sm:px-8 sm:py-8 lg:order-1 lg:min-h-full lg:px-10 lg:py-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl sm:h-56 sm:w-56" />
          <div className="absolute bottom-0 left-0 h-32 w-64 bg-gradient-to-r from-amber-400/30 to-transparent blur-2xl" />
          <div className="absolute right-0 top-1/2 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative">
            <p className="inline-block rounded-full border border-amber-300/40 bg-amber-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200 sm:text-xs">Admin Portal</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              GCTU Promotion
              <span className="block bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">Analysis & Decisions</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/95 sm:mt-5 sm:text-base">
              Advanced analytics, secure appraisals, promotion decisions, and complete audit trails—all in one professional system.
            </p>
          </div>

          <div className="relative mt-7 grid gap-3 text-sm text-blue-50/95 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-400/15 to-blue-400/5 px-4 py-4 font-medium shadow-sm">
              Session-Protected Authentication
            </div>
            <div className="rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-400/15 to-blue-400/5 px-4 py-4 font-medium shadow-sm">
              Complete Audit Coverage
            </div>
          </div>
        </section>

        <section className="order-1 bg-gradient-to-br from-slate-50 to-blue-50/50 px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 lg:order-2 lpads-slide-in">
          <div className="mb-7 sm:mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-amber-400 bg-gradient-to-r from-amber-300 to-amber-200 px-4 py-2 text-[11px] font-bold tracking-[0.22em] text-amber-950 shadow-md sm:text-xs">
              Secure Login
            </div>
            <h2 className="mt-4 text-3xl font-bold text-blue-900 sm:text-4xl lg:text-5xl">Access Management Console</h2>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-700 sm:text-base">
              Enter your administrator credentials to unlock the full system.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border-2 border-rose-400 bg-gradient-to-r from-rose-50 to-rose-100/50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-bold text-blue-900">
                Admin Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                placeholder="Enter admin username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-blue-900">
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 pr-12 text-sm font-medium text-slate-900 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-xl px-3 text-slate-500 transition hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.49 10.49 0 0 0 2.25 12c1.73 4.544 5.91 7.75 9.75 7.75 1.46 0 2.89-.33 4.22-.93" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5 17.5 17.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 10.5a2.12 2.12 0 1 0 3 3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 4.83A10.1 10.1 0 0 1 12 4.25c3.84 0 8.02 3.21 9.75 7.75a13.73 13.73 0 0 1-2.09 3.51" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.75 9.75-7.75S21.75 12 21.75 12 18 19.75 12 19.75 2.25 12 2.25 12Z" />
                      <circle cx="12" cy="12" r="3.25" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 px-4 py-4 text-sm font-bold text-amber-950 shadow-[0_12px_32px_rgba(217,119,6,0.4)] transition hover:shadow-[0_16px_40px_rgba(217,119,6,0.5)] hover:from-amber-300 hover:to-yellow-200 disabled:opacity-60 uppercase tracking-wide"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-center text-xs font-medium text-blue-700">
              Encrypted connection • Admin access only
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
