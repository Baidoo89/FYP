'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GctuBrandMark from '../../components/GctuBrandMark';
import { useToast } from '../../components/Toast';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const verificationStartedRef = useRef(false);
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  async function backToLogin() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.replace('/login');
    router.refresh();
  }

  useEffect(() => {
    if (verificationStartedRef.current) {
      return;
    }

    verificationStartedRef.current = true;

    async function verify() {
      if (!token) {
        const message = 'Verification token is missing.';
        setStatus('error');
        setMessage(message);
        toast.error('Verification issue', message);
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
        toast.success('Email verified', 'Your GCTU staff account is verified. Continue to onboarding.');
        setTimeout(() => router.push(data.nextPath || '/onboarding'), 900);
      } catch (verificationError) {
        const message = verificationError instanceof Error ? verificationError.message : 'Email verification failed';
        setStatus('error');
        setMessage(message);
        toast.error('Email verification failed', message);
      }
    }

    verify();
  }, [router, toast, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background px-4 py-10 text-brand-text dark:bg-[#07111f] dark:text-white">
      <section className="w-full max-w-lg rounded-2xl border border-brand-border bg-white p-6 text-center shadow-enterprise dark:border-[#26364d] dark:bg-[#0e1a2b] dark:shadow-black/30">
        <GctuBrandMark
          align="center"
          size="md"
          eyebrow="Email Verification"
          title="GCTU Account Verification"
          subtitle="Digital Staff Promotion Support System"
          className="mb-5"
        />
        <h1 className="text-2xl font-bold text-brand-text dark:text-white">
          {status === 'success' ? 'Verified' : status === 'error' ? 'Verification issue' : 'Please wait'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-muted dark:text-[#b7c6da]">{message}</p>

        {status === 'error' && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push('/check-email')}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primaryDark dark:bg-[#315f9f] dark:hover:bg-[#244a80]"
            >
              Request new link
            </button>
            <button
              type="button"
              onClick={backToLogin}
              className="rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-primarySoft dark:border-[#30435f] dark:bg-[#132239] dark:text-white dark:hover:bg-[#18345a]"
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
        <main className="flex min-h-screen items-center justify-center bg-brand-background px-4 py-10 text-brand-text dark:bg-[#07111f] dark:text-white">
          <section className="w-full max-w-lg rounded-2xl border border-brand-border bg-white p-6 text-center shadow-enterprise dark:border-[#26364d] dark:bg-[#0e1a2b] dark:shadow-black/30">
            <GctuBrandMark
              align="center"
              size="md"
              eyebrow="Email Verification"
              title="GCTU Account Verification"
              subtitle="Preparing verification..."
            />
          </section>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
