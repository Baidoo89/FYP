'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

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
      <section className="mx-auto max-w-xl rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Account Verification</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">Check your email</h1>
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
              className="font-semibold text-blue-700 underline"
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
            className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400"
          >
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to login
          </button>
        </div>
      </section>
    </main>
  );
}
