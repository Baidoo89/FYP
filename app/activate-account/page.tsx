'use client';

import { FormEvent, Suspense, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthPageShell from '../../components/auth/AuthPageShell';
import { useToast } from '../../components/Toast';

const inputClass = 'brand-input h-12 rounded-xl px-3.5 pr-12 text-sm shadow-sm placeholder:text-slate-400 hover:border-brand-primary/40 dark:placeholder:text-[#8394ad] dark:hover:border-[#5d789d]';

function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('Open the single-use activation link issued by HRODD.');
      return;
    }
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Use at least 10 characters with uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/activate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to activate staff access.');

      setSuccess(true);
      toast.success('Staff access activated', 'Your verified promotion workspace is ready.');
      setTimeout(() => {
        router.replace(payload.nextPath || '/lecturer-portal/start-application');
        router.refresh();
      }, 700);
    } catch (activationError) {
      const message = activationError instanceof Error ? activationError.message : 'Unable to activate staff access.';
      setError(message);
      toast.error('Activation failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell>
      <div className="mb-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary dark:text-brand-accent">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          HRODD-issued access
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-text dark:text-white">Activate staff account</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-[#b7c6da]">Choose a private password for the verified staff record linked to this invitation.</p>
      </div>

      {!token && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900" role="alert">
          A valid HRODD activation link is required.
        </div>
      )}
      {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800" role="alert">{error}</div>}
      {success ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          Access activated. Opening your promotion routes...
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <PasswordField label="New password" value={password} visible={showPassword} onChange={setPassword} onToggle={() => setShowPassword((value) => !value)} />
          <PasswordField label="Confirm password" value={confirmPassword} visible={showConfirmation} onChange={setConfirmPassword} onToggle={() => setShowConfirmation((value) => !value)} />
          <p className="text-xs leading-5 text-brand-muted dark:text-[#b7c6da]">At least 10 characters, including uppercase, lowercase, and a number.</p>
          <button type="submit" disabled={loading || !token} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:opacity-60">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {loading ? 'Activating...' : 'Activate Staff Access'}
          </button>
        </form>
      )}
    </AuthPageShell>
  );
}

function PasswordField({ label, value, visible, onChange, onToggle }: { label: string; value: string; visible: boolean; onChange: (value: string) => void; onToggle: () => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">{label}</span>
      <span className="relative block">
        <input type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" className={inputClass} />
        <button type="button" onClick={onToggle} className="absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-lg text-brand-muted hover:bg-brand-primarySoft hover:text-brand-primary" title={visible ? 'Hide password' : 'Show password'} aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<AuthPageShell><p className="text-sm text-brand-muted">Preparing secure activation...</p></AuthPageShell>}>
      <ActivateAccountForm />
    </Suspense>
  );
}
