'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type LoginResponse = {
  success: boolean;
  error?: string;
  role?: 'LECTURER' | 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN';
};

const DASHBOARD_BY_ROLE: Record<NonNullable<LoginResponse['role']>, string> = {
  LECTURER: '/lecturer-portal',
  HOD_DEAN: '/hod/dashboard',
  HR_ADMIN: '/hr/dashboard',
  COMMITTEE_REVIEWER: '/committee/dashboard',
  SYSTEM_ADMIN: '/system-admin/dashboard',
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

      router.push(data.role ? DASHBOARD_BY_ROLE[data.role] : '/lecturer-portal');
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden bg-[#172033] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-sm font-bold shadow-lg shadow-teal-950/20">
              GP
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">GCTU Promotion System</p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight">
              Digital promotion review, evidence verification, and decisions.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
              A secure workspace for lecturers, HODs, HR administrators, committee reviewers, and system administrators.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold">Role-based portals</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">Every user lands in the correct workspace after authentication.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold">Verified academic evidence</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">Promotion records, audit history, and notifications stay connected.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white">
                GP
              </div>
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-teal-700 lg:mt-0">Secure access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in to continue</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your verified GCTU promotion system account to access your workspace.
            </p>

            {error && (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-800">
                  Email or username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  placeholder="lecturer.demo@live.gctu.edu.gh"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 pr-16 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-1 right-1 rounded-md px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-700/15 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-medium text-slate-600">
                New lecturer? <a href="/register" className="font-semibold text-teal-700 hover:text-teal-800">Create your account</a>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}