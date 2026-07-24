'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, Clock3, KeyRound, LockKeyhole, MonitorCheck, ShieldCheck } from 'lucide-react';
import { ErrorState, LoadingState, SectionCard } from '../../../components/enterprise-ui';
import StatusBadge from '../../../components/promotion/StatusBadge';
import { useToast } from '../../../components/Toast';

type SessionRecord = {
  id: number | string;
  startedAt: string;
  browser: string;
  platform: string;
  deviceType: string;
  device: string;
  ipAddress: string;
  location: string;
  active: boolean;
};

type TimelineRecord = {
  label: string;
  date: string | null;
  status: string;
};

type ProfileData = {
  profile: {
    email: string;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    name: string;
    role: string;
    currentRank: string | null;
    department: string | null;
    faculty: string | null;
    staffId: string | null;
    onboarded: boolean;
    joinedAt: string;
  };
  security: {
    lastLogin: SessionRecord;
    currentSession: SessionRecord;
    recentSessions: SessionRecord[];
    timeline: TimelineRecord[];
    emailVerification: {
      method: string;
      status: string;
      verifiedBy: string;
    };
    notificationPreferences: string[];
    system: {
      version: string;
      buildNumber: string;
      lastUpdated: string;
    };
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

function formatTime(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
}

function useCurrentThemeLabel() {
  const [themeLabel, setThemeLabel] = useState('Light Mode');

  useEffect(() => {
    function syncTheme() {
      setThemeLabel(document.documentElement.classList.contains('dark') ? 'Dark Mode' : 'Light Mode');
    }

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('storage', syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  return themeLabel;
}

export default function LecturerSettingsPage() {
  const toast = useToast();
  const themeLabel = useCurrentThemeLabel();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadProfile() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/account/settings', { cache: 'no-store' });
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

      const nextMessage = payload.message || 'Verification email sent.';
      setMessage(nextMessage);
      toast.success('Verification email sent', nextMessage);
      await loadProfile();
    } catch (sendError) {
      const nextError = sendError instanceof Error ? sendError.message : 'Failed to resend verification email';
      setError(nextError);
      toast.error('Unable to resend email', nextError);
    } finally {
      setSaving(false);
    }
  }

  async function signOutOtherDevices(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSessionSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/account/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SIGN_OUT_OTHER_DEVICES' }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update sessions');
      }

      const nextMessage = payload.message || 'Current session remains active.';
      setMessage(nextMessage);
      toast.success('Session management updated', nextMessage);
      await loadProfile();
    } catch (sessionError) {
      const nextError = sessionError instanceof Error ? sessionError.message : 'Unable to update sessions';
      setError(nextError);
      toast.error('Session update failed', nextError);
    } finally {
      setSessionSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading account settings..." />;
  if (error && !data) return <ErrorState message={error} />;

  const profile = data?.profile;
  const security = data?.security;
  const lastLogin = security?.lastLogin;
  const currentSession = security?.currentSession;

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8" aria-labelledby="settings-title">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Account Controls</div>
            <h1 id="settings-title" className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Settings</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Manage secure account access, email verification, notification entry points, and official profile visibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Account status">
            <StatusBadge status={profile?.emailVerified ? 'VERIFIED' : 'PENDING'} label={profile?.emailVerified ? 'Email Verified' : 'Email Pending'} />
            <StatusBadge status={profile?.onboarded ? 'COMPLETED' : 'PENDING'} label={profile?.onboarded ? 'Onboarded' : 'Onboarding'} />
          </div>
        </div>
      </section>

      {message && <div role="status" className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
      {error && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard title="Secure Identity" description="Your promotion account is tied to official university staff records.">
          <div className="mb-4 rounded-lg border border-brand-primary/15 bg-brand-primarySoft px-4 py-3 text-sm leading-6 text-brand-primary">
            This information is synchronized with the University's HR database and cannot be modified from this portal.
          </div>
          <div className="grid gap-3">
            <InfoRow label="Full name" value={profile?.name || 'Not available'} />
            <InfoRow label="Official email" value={profile?.email || 'Not available'} />
            <InfoRow label="Staff ID" value={profile?.staffId || 'Not recorded'} />
            <InfoRow label="Faculty" value={profile?.faculty || 'Not available'} />
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
              <div className="mt-4 grid gap-3">
                <InfoRow label="Verification Method" value={security?.emailVerification.method || 'University Email'} />
                <InfoRow label="Status" value={security?.emailVerification.status || (profile?.emailVerified ? 'Verified' : 'Pending')} />
                <InfoRow label="Verified By" value={security?.emailVerification.verifiedBy || 'System'} />
              </div>
              {!profile?.emailVerified && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={saving}
                  aria-label="Resend verification email to official GCTU staff email"
                  className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Last Login" description="Most recent successful sign-in activity for this account.">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-white text-brand-primary">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-950">{formatDate(lastLogin?.startedAt)}</p>
                  <p className="mt-1 text-sm text-gray-600">{formatTime(lastLogin?.startedAt)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <InfoRow label="Device" value={lastLogin?.device || 'Not available'} />
                <InfoRow label="Device type" value={lastLogin?.deviceType || 'Not available'} />
                <InfoRow label="Location" value={lastLogin?.location || 'Location unavailable'} />
                <InfoRow label="IP address" value={lastLogin?.ipAddress || 'Not available'} />
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1fr]">
        <SectionCard title="Session Management" description="View active access details and keep your current device signed in.">
          <div className="grid gap-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Current Session</p>
                  <p className="mt-1 text-sm leading-6 opacity-80">Active on {currentSession?.device || 'this device'}.</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Active
                </span>
              </div>
            </div>

            <div aria-labelledby="recent-sessions-title">
              <h3 id="recent-sessions-title" className="text-sm font-bold text-gray-950">Recent Sessions</h3>
              <div className="mt-3 grid gap-2">
                {(security?.recentSessions || []).slice(0, 4).map((sessionItem) => (
                  <div key={sessionItem.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-gray-950">{sessionItem.device}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDate(sessionItem.startedAt)} at {formatTime(sessionItem.startedAt)}</p>
                      </div>
                      <span className="w-fit rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-600">{sessionItem.deviceType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={signOutOtherDevices} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-gray-600">Keep current session active while reviewing other device access.</p>
              <button
                type="submit"
                disabled={sessionSaving}
                aria-label="Sign out from other devices and keep this session active"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                {sessionSaving ? 'Updating...' : 'Sign Out Other Devices'}
              </button>
            </form>
          </div>
        </SectionCard>

        <SectionCard title="Account Timeline" description="Key dates for your promotion portal account, shown chronologically.">
          <ol className="grid gap-3" aria-label="Account timeline">
            {(security?.timeline || []).map((item) => (
              <li key={`${item.label}-${item.date || 'pending'}`} className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-primary shadow-sm">
                  <MonitorCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-950">{item.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(item.date)}{item.date ? ` at ${formatTime(item.date)}` : ''}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <PreferenceCard
          title="Theme"
          detail="Use the topbar theme switcher to move between light and professional dark mode across the portal."
          actionLabel="Theme switcher"
          extra={<span className="mt-3 block text-sm font-semibold text-gray-950">Current Theme: {themeLabel}</span>}
        />
        <NotificationPreferencesCard preferences={security?.notificationPreferences || []} />
        <PrivacyDataCard />
      </section>

      <SettingsFooter system={security?.system} />

      <div className="flex flex-wrap gap-3">
        <Link href="/lecturer-portal" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">Back to Dashboard</Link>
        <Link href="/lecturer-portal/help" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">Help Center</Link>
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

function PreferenceCard({ title, detail, actionLabel, href, extra }: { title: string; detail: string; actionLabel: string; href?: string; extra?: ReactNode }) {
  const content = (
    <>
      <p className="font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{detail}</p>
      {extra}
      <span className="mt-4 inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-teal-700">{actionLabel}</span>
    </>
  );

  if (href) {
    return <Link href={href} className="pro-card block p-5 hover:border-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">{content}</Link>;
  }

  return <div className="pro-card p-5">{content}</div>;
}

function NotificationPreferencesCard({ preferences }: { preferences: string[] }) {
  const items = preferences.length > 0 ? preferences : ['Workflow updates', 'HR feedback', 'Committee decisions', 'Promotion status'];

  return (
    <div className="pro-card p-5" aria-labelledby="notification-preferences-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primarySoft text-brand-primary">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p id="notification-preferences-title" className="font-semibold text-gray-950">Notification Preferences</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">These workflow notifications are enabled for your account.</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2" aria-label="Notification preferences">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrivacyDataCard() {
  return (
    <div className="pro-card p-5" aria-labelledby="privacy-data-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primarySoft text-brand-primary">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p id="privacy-data-title" className="font-semibold text-gray-950">Privacy & Data</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">Promotion documents are securely stored, official records are managed by HR, and only authorized reviewers can access promotion evidence. The system follows university data protection policies, and users cannot edit official HR records directly.</p>
        </div>
      </div>
    </div>
  );
}

function SettingsFooter({ system }: { system?: ProfileData['security']['system'] }) {
  return (
    <footer className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm" aria-label="Settings system information">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-950">
          <ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
          Official Digital Staff Promotion Support System
        </div>
        <div className="grid gap-1 text-xs sm:text-right">
          <span>Version {system?.version || '1.0'}</span>
          <span>Build {system?.buildNumber || '2026.07.24'}</span>
          <span>Last Updated: {formatDate(system?.lastUpdated || '2026-07-24')}</span>
        </div>
      </div>
    </footer>
  );
}