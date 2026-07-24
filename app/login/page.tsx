'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from '../../components/auth/AuthPageShell';
import { useToast } from '../../components/Toast';

type LoginResponse = {
  success: boolean;
  error?: string;
  role?: 'LECTURER' | 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN';
  name?: string;
};

const DASHBOARD_BY_ROLE: Record<NonNullable<LoginResponse['role']>, string> = {
  LECTURER: '/lecturer-portal',
  HOD_DEAN: '/hod/dashboard',
  HR_ADMIN: '/hr/dashboard',
  COMMITTEE_REVIEWER: '/committee/dashboard',
  SYSTEM_ADMIN: '/system-admin/dashboard',
};

const inputClass = 'brand-input h-12 rounded-xl px-3.5 text-sm shadow-sm placeholder:text-slate-400 hover:border-brand-primary/40 dark:placeholder:text-[#8394ad] dark:hover:border-[#5d789d]';
const primaryButtonClass = 'mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white shadow-lg shadow-brand-primary/15 outline-none transition duration-200 hover:-translate-y-0.5 hover:bg-brand-primaryDark focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:bg-[#315f9f] dark:hover:bg-[#244a80] dark:focus-visible:ring-[#93b7f0] dark:focus-visible:ring-offset-[#0e1a2b]';
const linkClass = 'rounded-sm font-semibold text-brand-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:text-[#bfd7ff] dark:focus-visible:ring-offset-[#0e1a2b]';
const passwordToggleClass = 'absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-brand-muted outline-none transition hover:bg-brand-primarySoft hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary dark:text-[#b7c6da] dark:hover:bg-[#132239] dark:hover:text-white dark:focus-visible:ring-[#93b7f0]';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
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
      toast.warning('Complete required fields', 'Enter your GCTU email and password to continue.');
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
      toast.success('Welcome back', `Signed in as ${data.name || username.trim()}. Redirecting to your workspace.`);
      router.push(data.role ? DASHBOARD_BY_ROLE[data.role] : '/lecturer-portal');
      router.refresh();
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Login failed';
      setError(message);
      toast.error('Sign in failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell active="login">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary dark:text-brand-accent">Staff access</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text dark:text-white">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-[#b7c6da]">Use your official GCTU account to continue.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
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
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
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
              className={passwordToggleClass}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && <p id="password-error" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{fieldErrors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={primaryButtonClass}
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {success ? 'Access granted' : loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted dark:text-[#b7c6da]">
        New lecturer?{' '}
        <a href="/register" className={linkClass}>
          Create account
        </a>
      </p>
    </AuthPageShell>
  );
}
