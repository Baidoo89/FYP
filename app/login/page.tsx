'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell, { AuthTrustStrip } from '../../components/auth/AuthPageShell';

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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Staff access</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Welcome Back</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign in to access your secure GCTU promotion workspace.
        </p>
        <AuthTrustStrip />
      </div>

      {error && (
        <div className="mb-5 animate-[lpadsFade_0.2s_ease-out] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-800">
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
            aria-describedby="username-message"
            autoComplete="username"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-2 focus:border-blue-800 focus:shadow-[0_0_0_4px_rgba(30,64,175,0.12)]"
            placeholder="name@live.gctu.edu.gh"
          />
          <p id="username-message" className={`mt-2 text-xs leading-5 transition duration-200 ${fieldErrors.username ? 'text-red-700' : 'text-slate-500'}`}>
            {fieldErrors.username || 'Use your official GCTU staff account.'}
          </p>
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
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: '' }));
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby="password-message"
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-16 text-sm text-slate-950 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-2 focus:border-blue-800 focus:shadow-[0_0_0_4px_rgba(30,64,175,0.12)]"
              placeholder="Enter your password"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-slate-500 outline-none transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-800 active:scale-95"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p id="password-message" className={`mt-2 text-xs leading-5 transition duration-200 ${fieldErrors.password ? 'text-red-700' : 'text-slate-500'}`}>
            {fieldErrors.password || 'Your password is protected during sign in.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-950 hover:shadow-xl hover:shadow-blue-900/20 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {success ? 'Access granted' : loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-medium text-slate-600">
          New lecturer? <a href="/register" className="rounded-sm font-semibold text-blue-900 outline-none transition hover:text-blue-950 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 dark:hover:text-blue-200">Create account</a>
        </div>
      </form>
    </AuthPageShell>
  );
}
