'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Email verification failed');
        }

        setStatus('success');
        setMessage('Email verified successfully. Redirecting...');
        setTimeout(() => router.push(data.nextPath || '/onboarding'), 900);
      } catch (verificationError) {
        setStatus('error');
        setMessage(verificationError instanceof Error ? verificationError.message : 'Email verification failed');
      }
    }

    verify();
  }, [router, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Email Verification</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">
          {status === 'success' ? 'Verified' : status === 'error' ? 'Verification issue' : 'Please wait'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>

        {status === 'error' && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push('/check-email')}
              className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Request new link
            </button>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to login
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
          <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-700">Preparing verification...</p>
          </section>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
