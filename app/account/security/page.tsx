'use client';

import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useToast } from '../../../components/Toast';

export default function AccountSecurityPage() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      const nextError = 'New password and confirmation do not match.';
      setError(nextError);
      toast.error('Password not changed', nextError);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to change password');
      }

      const successMessage = payload.message || 'Password changed successfully.';
      setMessage(successMessage);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed', successMessage);
    } catch (changeError) {
      const nextError = changeError instanceof Error ? changeError.message : 'Unable to change password';
      setError(nextError);
      toast.error('Password not changed', nextError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-enterprise dark:border-[#26364d] dark:bg-[#0e1a2b]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-muted dark:text-[#b7c6da]">Account Security</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-text dark:text-white">Change Password</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted dark:text-[#b7c6da]">
              Update temporary or current credentials used for the GCTU Digital Staff Promotion Support System.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primarySoft text-brand-primary dark:bg-[#18345a] dark:text-[#bfd7ff]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <form onSubmit={changePassword} className="rounded-2xl border border-brand-border bg-white p-6 shadow-enterprise-soft dark:border-[#26364d] dark:bg-[#0e1a2b]">
          <h2 className="text-lg font-semibold text-brand-text dark:text-white">Password Details</h2>
          <div className="mt-5 space-y-4">
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrent}
              onToggle={() => setShowCurrent((value) => !value)}
              autoComplete="current-password"
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNew}
              onToggle={() => setShowNew((value) => !value)}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showNew}
              onToggle={() => setShowNew((value) => !value)}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-400/30 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
          {message && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-[#315f9f] dark:hover:bg-[#244a80]"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Changing password...' : 'Change Password'}
          </button>
        </form>

        <aside className="rounded-2xl border border-brand-border bg-brand-background p-6 shadow-enterprise-soft dark:border-[#26364d] dark:bg-[#101c2e]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-primary shadow-sm dark:bg-[#132239] dark:text-[#bfd7ff]">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-brand-text dark:text-white">Secure Access</h2>
          <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-[#b7c6da]">
            Use this page after receiving a temporary password from the system administrator. Your password change is recorded in the audit log for account security.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-brand-muted dark:text-[#b7c6da]">
            <li>Use at least 8 characters.</li>
            <li>Avoid reusing your temporary password.</li>
            <li>Keep your official GCTU account credentials private.</li>
          </ul>
        </aside>
      </section>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          className="brand-input pr-12 dark:border-[#30435f] dark:bg-[#132239] dark:text-white"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-1 right-1 inline-flex w-10 items-center justify-center rounded-lg text-brand-muted transition hover:bg-brand-primarySoft hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary dark:text-[#b7c6da] dark:hover:bg-[#18345a] dark:hover:text-white"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
