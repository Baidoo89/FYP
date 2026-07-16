'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ErrorState, LoadingState, SectionCard } from '../../../components/enterprise-ui';
import StatusBadge from '../../../components/promotion/StatusBadge';

type ProfileData = {
  profile: {
    email: string;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    name: string;
    role: string;
    currentRank: string;
    department: string;
    staffId: string | null;
    onboarded: boolean;
    joinedAt: string;
  };
};

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function LecturerSettingsPage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadProfile() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lecturer/profile', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load account settings');
      }

      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load account settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function resendVerification() {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to resend verification email');
      }

      setMessage(payload.message || 'Verification email sent.');
      await loadProfile();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to resend verification email');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading account settings..." />;
  if (error && !data) return <ErrorState message={error} />;

  const profile = data?.profile;

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Account Controls</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Settings</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Manage secure account access, email verification, notification entry points, and official profile visibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={profile?.emailVerified ? 'VERIFIED' : 'PENDING'} label={profile?.emailVerified ? 'Email Verified' : 'Email Pending'} />
            <StatusBadge status={profile?.onboarded ? 'COMPLETED' : 'PENDING'} label={profile?.onboarded ? 'Onboarded' : 'Onboarding'} />
          </div>
        </div>
      </section>

      {message && <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard title="Secure Identity" description="Your promotion account is tied to official university staff records.">
          <div className="grid gap-3">
            <InfoRow label="Full name" value={profile?.name || 'Not available'} />
            <InfoRow label="Official email" value={profile?.email || 'Not available'} />
            <InfoRow label="Staff ID" value={profile?.staffId || 'Not recorded'} />
            <InfoRow label="Department" value={profile?.department || 'Not available'} />
            <InfoRow label="Current rank" value={label(profile?.currentRank)} />
            <InfoRow label="Role" value={label(profile?.role)} />
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Email Verification" description="Verification helps protect promotion communication and notifications.">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-950">{profile?.emailVerified ? 'Your email is verified.' : 'Your email still needs verification.'}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {profile?.emailVerified
                  ? `Verified on ${formatDate(profile.emailVerifiedAt)}.`
                  : 'Send a new verification email and complete the link from your official mailbox.'}
              </p>
              {!profile?.emailVerified && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={saving}
                  className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Account Timeline" description="Key dates for your promotion portal account.">
            <div className="grid gap-3">
              <InfoRow label="Account created" value={formatDate(profile?.joinedAt)} />
              <InfoRow label="Email verified" value={formatDate(profile?.emailVerifiedAt)} />
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <PreferenceCard title="Theme" detail="Use the topbar theme switcher to move between light and professional dark mode across the portal." actionLabel="Theme switcher" />
        <PreferenceCard title="Notifications" detail="Workflow updates, document decisions, and review messages are delivered in the notification center." actionLabel="Open notifications" href="/notifications" />
        <PreferenceCard title="Profile Changes" detail="Official name, rank, department, and staff ID are HR-managed records and require administrative approval." actionLabel="View profile" href="/lecturer-portal/profile" />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/lecturer-portal" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">Back to Dashboard</Link>
        <Link href="/lecturer-portal/help" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Help Center</Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{label}</span>
      <span className="break-all text-sm font-semibold text-gray-950 sm:text-right">{value}</span>
    </div>
  );
}

function PreferenceCard({ title, detail, actionLabel, href }: { title: string; detail: string; actionLabel: string; href?: string }) {
  const content = (
    <>
      <p className="font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{detail}</p>
      <span className="mt-4 inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-teal-700">{actionLabel}</span>
    </>
  );

  if (href) {
    return <Link href={href} className="pro-card block p-5 hover:border-teal-200">{content}</Link>;
  }

  return <div className="pro-card p-5">{content}</div>;
}
