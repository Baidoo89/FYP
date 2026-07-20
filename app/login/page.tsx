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

const inputClass = 'h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0b2d5b] focus:ring-4 focus:ring-[#0b2d5b]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-500';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      username: username.trim() ? '' : 'Enter your GCTU email or username.',
      password: password.trim() ? '' : 'Enter your password.',
    };

    setFieldErrors(nextErrors);
    setError('');

    if (nextErrors.username || nextErrors.password) {
      return;
    }

    setLoading(true);
    setSuccess(false);

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

      setSuccess(true);
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
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0b2d5b] dark:text-yellow-100">Staff access</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Use your official GCTU account to continue.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Email or username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (fieldErrors.username) setFieldErrors((current) => ({ ...current, username: '' }));
            }}
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? 'username-error' : undefined}
            autoComplete="username"
            className={inputClass}
            placeholder="name@live.gctu.edu.gh"
          />
          {fieldErrors.username && <p id="username-error" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{fieldErrors.username}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: '' }));
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              autoComplete="current-password"
              className={`${inputClass} pr-16`}
              placeholder="Enter password"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-[#0b2d5b] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && <p id="password-error" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{fieldErrors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b2d5b] px-4 text-sm font-semibold text-white shadow-lg shadow-[#0b2d5b]/15 outline-none transition duration-200 hover:-translate-y-0.5 hover:bg-[#082346] focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:focus-visible:ring-offset-slate-900"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {success ? 'Access granted' : loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        New lecturer?{' '}
        <a href="/register" className="rounded-sm font-semibold text-[#0b2d5b] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 dark:text-yellow-100 dark:focus-visible:ring-offset-slate-900">
          Create account
        </a>
      </p>
    </AuthPageShell>
  );
}
