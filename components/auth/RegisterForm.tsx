'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '../../lib/validation/auth.schema';
import { AuthTrustStrip } from './AuthPageShell';

type RegisterFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Staff registration</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Create Your Account</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Register using your official GCTU staff email to begin your promotion journey.
        </p>
        <AuthTrustStrip />
      </div>

      {error && (
        <div className="mb-5 animate-[lpadsFade_0.2s_ease-out] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
          {error}
        </div>
      )}

      {verificationUrl && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Development verification link:{' '}
          <button
            type="button"
            onClick={() => router.push(verificationUrl.replace(window.location.origin, ''))}
            className="rounded-sm font-semibold text-blue-900 underline outline-none transition hover:text-blue-950 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 dark:hover:text-blue-200"
          >
            verify account
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
            Official GCTU staff email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby="email-message"
            placeholder="name@live.gctu.edu.gh"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-2 focus:border-blue-800 focus:shadow-[0_0_0_4px_rgba(30,64,175,0.12)]"
          />
          <p id="email-message" className={`mt-2 text-xs leading-5 transition duration-200 ${fieldErrors.email ? 'text-red-700' : 'text-slate-500'}`}>
            {fieldErrors.email || 'Use an official @live.gctu.edu.gh address.'}
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby="new-password-message"
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-16 text-sm text-slate-950 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-2 focus:border-blue-800 focus:shadow-[0_0_0_4px_rgba(30,64,175,0.12)]"
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
          <p id="new-password-message" className={`mt-2 text-xs leading-5 transition duration-200 ${fieldErrors.password ? 'text-red-700' : 'text-slate-500'}`}>
            {fieldErrors.password || 'Use at least 8 characters.'}
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-800">
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
              aria-describedby="confirm-password-message"
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-16 text-sm text-slate-950 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-2 focus:border-blue-800 focus:shadow-[0_0_0_4px_rgba(30,64,175,0.12)]"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-slate-500 outline-none transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-800 active:scale-95"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p id="confirm-password-message" className={`mt-2 text-xs leading-5 transition duration-200 ${fieldErrors.confirmPassword ? 'text-red-700' : 'text-slate-500'}`}>
            {fieldErrors.confirmPassword || 'Re-enter your password to confirm.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-950 hover:shadow-xl hover:shadow-blue-900/20 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {success ? 'Account created' : loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="rounded-sm font-semibold text-blue-900 outline-none transition hover:text-blue-950 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 dark:hover:text-blue-200"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
