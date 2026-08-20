'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '../../lib/validation/auth.schema';
import { useToast } from '../Toast';

type RegisterFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const inputClass = 'brand-input h-12 rounded-xl px-3.5 text-sm shadow-sm placeholder:text-slate-400 hover:border-brand-primary/40 dark:placeholder:text-[#8394ad] dark:hover:border-[#5d789d]';
const primaryButtonClass = 'mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white shadow-lg shadow-brand-primary/15 outline-none transition duration-200 hover:-translate-y-0.5 hover:bg-brand-primaryDark focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:bg-[#315f9f] dark:hover:bg-[#244a80] dark:focus-visible:ring-[#93b7f0] dark:focus-visible:ring-offset-[#0e1a2b]';
const linkClass = 'rounded-sm font-semibold text-brand-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:text-[#bfd7ff] dark:focus-visible:ring-offset-[#0e1a2b]';
const passwordToggleClass = 'absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-brand-muted outline-none transition hover:bg-brand-primarySoft hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary dark:text-[#b7c6da] dark:hover:bg-[#132239] dark:hover:text-white dark:focus-visible:ring-[#93b7f0]';

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();
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
        toast.warning('Check registration details', 'Resolve the highlighted fields before creating the account.');
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
        const message = data.error || 'Registration failed';
        setError(message);
        toast.error('Account creation failed', message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Account created', data.message || 'Verification email sent. Check your GCTU staff mailbox to continue.');
      if (data.verificationUrl) {
        window.sessionStorage.setItem('localVerificationUrl', data.verificationUrl);
      } else {
        window.sessionStorage.removeItem('localVerificationUrl');
      }

      router.push('/check-email');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error('Registration issue', message);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary dark:text-brand-accent">Lecturer registration</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text dark:text-white">Create account</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-[#b7c6da]">Use your official GCTU staff email.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </div>
      )}


      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
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
            <p id="email-note" className="mt-2 text-xs text-brand-muted dark:text-[#b7c6da]">Only @live.gctu.edu.gh accounts are accepted.</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
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
              className={passwordToggleClass}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && <p id="new-password-error" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{fieldErrors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
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
              className={passwordToggleClass}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p id="confirm-password-error" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{fieldErrors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={primaryButtonClass}
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {success ? 'Account created' : loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted dark:text-[#b7c6da]">
        Already registered?{' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className={linkClass}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
