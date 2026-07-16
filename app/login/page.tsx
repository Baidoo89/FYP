'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from '../../components/auth/AuthPageShell';

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
    <AuthPageShell active="login">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Secure GCTU access</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in to the promotion system</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use your verified GCTU Digital Staff Promotion Support System account to enter your role-specific workspace.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-800">
            GCTU email or username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 pr-16 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
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
          className="w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-800/15 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-medium text-slate-600">
          New GCTU lecturer? <a href="/register" className="font-semibold text-emerald-800 hover:text-emerald-900">Create your staff promotion account</a>
        </div>
      </form>
    </AuthPageShell>
  );
}
