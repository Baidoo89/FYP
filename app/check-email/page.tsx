'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GctuBrandMark from '../../components/GctuBrandMark';

export default function CheckEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  async function backToLogin() {
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

      setMessage(data.message || 'Verification email sent');
      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl);
      }
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Unable to resend verification email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70">
        <GctuBrandMark
          align="center"
          size="md"
          eyebrow="Account Verification"
          title="Check your email"
          subtitle="GCTU Digital Staff Promotion Support System"
          className="mb-5"
        />
        <p className="mt-3 text-sm leading-6 text-slate-700">
          We sent a verification link to your registered email address. Verify your email before completing your staff profile and submitting any promotion request.
        </p>

        {message && <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}
        {error && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        {verificationUrl && (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Development link:{' '}
            <button
              type="button"
              onClick={() => router.push(verificationUrl.replace(window.location.origin, ''))}
              className="font-semibold text-teal-700 underline"
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
            className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400"
          >
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
          <button
            type="button"
            onClick={backToLogin}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to login
          </button>
        </div>
      </section>
    </main>
  );
}
