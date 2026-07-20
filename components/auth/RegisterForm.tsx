'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '../../lib/validation/auth.schema';

type RegisterFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const inputClass = 'h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0b2d5b] focus:ring-4 focus:ring-[#0b2d5b]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-500';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [verificationUrl, setVerificationUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name as keyof RegisterFieldErrors]) {
      setFieldErrors((current) => ({ ...current, [name]: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    setSuccess(false);

    try {
      const validation = registerSchema.safeParse(formData);
      if (!validation.success) {
        const nextErrors: RegisterFieldErrors = {};
        for (const issue of validation.error.issues) {
          const field = issue.path[0] as keyof RegisterFieldErrors | undefined;
          if (field && !nextErrors[field]) {
            nextErrors[field] = issue.message;
          }
        }
        setFieldErrors(nextErrors);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl);
      }

      router.push('/check-email');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0b2d5b] dark:text-yellow-100">Lecturer registration</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Create account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Use your official GCTU staff email.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </div>
      )}

      {verificationUrl && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Development verification link:{' '}
          <button
            type="button"
            onClick={() => router.push(verificationUrl.replace(window.location.origin, ''))}
            className="rounded-sm font-semibold text-[#0b2d5b] underline outline-none transition hover:text-[#082346] focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 dark:text-yellow-100 dark:focus-visible:ring-offset-slate-900"
          >
            verify account
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Official GCTU email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : 'email-note'}
            placeholder="name@live.gctu.edu.gh"
            className={inputClass}
          />
          {fieldErrors.email ? (
            <p id="email-error" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{fieldErrors.email}</p>
          ) : (
            <p id="email-note" className="mt-2 text-xs text-slate-500 dark:text-slate-400">Only @live.gctu.edu.gh accounts are accepted.</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'new-password-error' : undefined}
              autoComplete="new-password"
              className={`${inputClass} pr-16`}
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
          {fieldErrors.password && <p id="new-password-error" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{fieldErrors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
              autoComplete="new-password"
              className={`${inputClass} pr-16`}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-[#0b2d5b] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p id="confirm-password-error" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{fieldErrors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b2d5b] px-4 text-sm font-semibold text-white shadow-lg shadow-[#0b2d5b]/15 outline-none transition duration-200 hover:-translate-y-0.5 hover:bg-[#082346] focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:focus-visible:ring-offset-slate-900"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {success ? 'Account created' : loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Already registered?{' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="rounded-sm font-semibold text-[#0b2d5b] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 dark:text-yellow-100 dark:focus-visible:ring-offset-slate-900"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
