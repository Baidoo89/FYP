'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GctuBrandMark from '../../components/GctuBrandMark';
import { useToast } from '../../components/Toast';

export default function CheckEmailPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  async function backToLogin() {
    toast.info('Returning to sign in', 'You can sign in after your official staff email has been verified.');
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.replace('/login');
    router.refresh();
  }

  async function resendVerification() {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to resend verification email');
      }

      const message = data.message || 'Verification email sent';
      setMessage(message);
      toast.success('Verification email sent', message);
      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl);
      }
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : 'Unable to resend verification email';
      setError(message);
      toast.error('Unable to resend email', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-background px-4 py-10 text-brand-text dark:bg-[#07111f] dark:text-white">
      <section className="mx-auto max-w-xl rounded-2xl border border-brand-border bg-white p-6 shadow-enterprise dark:border-[#26364d] dark:bg-[#0e1a2b] dark:shadow-black/30">
        <GctuBrandMark
          align="center"
          size="md"
          eyebrow="Account Verification"
          title="Check your email"
          subtitle="GCTU Digital Staff Promotion Support System"
          className="mb-5"
        />
        <p className="mt-3 text-sm leading-6 text-brand-muted dark:text-[#b7c6da]">
          We sent a verification link to your registered official GCTU staff email. Verify your email before accessing your secure promotion workspace.
        </p>

        {message && <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}
        {error && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        {verificationUrl && (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Development link:{' '}
            <button
              type="button"
              onClick={() => router.push(verificationUrl.replace(window.location.origin, ''))}
              className="font-semibold text-brand-primary underline dark:text-[#bfd7ff]"
            >
              verify account
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resendVerification}
            disabled={loading}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primaryDark disabled:bg-slate-400 dark:bg-[#315f9f] dark:hover:bg-[#244a80]"
          >
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
          <button
            type="button"
            onClick={backToLogin}
            className="rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-primarySoft dark:border-[#30435f] dark:bg-[#132239] dark:text-white dark:hover:bg-[#18345a]"
          >
            Back to login
          </button>
        </div>
      </section>
    </main>
  );
}
