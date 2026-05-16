'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProfileData {
  profile: {
    email: string;
    name: string;
    role: string;
    currentRank: string;
    department: string;
    staffId: string | null;
    onboarded: boolean;
    joinedAt: string;
  };
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/lecturer/profile');
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load profile');
        }

        setData(payload.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          Loading your profile...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center font-medium text-blue-900 shadow-sm">
          {error || 'Failed to load profile'}
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-700/20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.18),transparent_32%)]"></div>
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100">
              Account Settings
            </div>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-2xl font-black tracking-tight text-white shadow-lg backdrop-blur-sm">
                {initials || 'A'}
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Academic Profile</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-100/90">
                  Your official university academic profile. This information is tied to your employment contract and cannot be edited after onboarding.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {profile.onboarded ? (
                <div className="inline-flex rounded-full border border-blue-300 bg-blue-500/20 px-4 py-2">
                  <span className="text-sm font-semibold text-blue-100">✓ Active Profile</span>
                </div>
              ) : (
                <div className="inline-flex rounded-full border border-yellow-300 bg-yellow-500/20 px-4 py-2">
                  <span className="text-sm font-semibold text-yellow-100">⏳ Pending Verification</span>
                </div>
              )}
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2">
                <span className="text-sm font-semibold text-white/90">Read-only academic record</span>
              </div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2">
                <span className="text-sm font-semibold text-white/90">HR-managed staff identity</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100/70">Full Name</p>
                <p className="mt-3 text-base font-semibold text-white">{profile.name}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100/70">Staff ID</p>
                <p className="mt-3 text-base font-semibold font-mono text-white">{profile.staffId || '—'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100/70">Current Rank</p>
                <p className="mt-3 text-base font-semibold text-white">{profile.currentRank}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100/70">Department</p>
                <p className="mt-3 text-base font-semibold text-white">{profile.department}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Read-Only Info Banner */}
      <div className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-6">
        <div className="flex gap-4">
          <div className="mt-0.5 text-2xl flex-shrink-0">🔒</div>
          <div>
            <p className="font-semibold text-blue-950">Profile is Read-Only</p>
            <p className="mt-1 text-sm text-blue-900">Your academic profile is managed by the University HR system. Any changes must be requested through official HR channels.</p>
          </div>
        </div>
      </div>

      {/* Primary Contact Information */}
      <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="text-2xl">📧</span>
          <h2 className="text-xl font-bold text-slate-900">Official Contact Information</h2>
        </div>

        {/* Official Email - Enhanced */}
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Official University Email</p>
              <p className="mt-3 font-mono text-lg font-bold text-blue-900 break-all">{profile.email}</p>
              <p className="mt-2 text-xs text-blue-700">
                <span className="inline-block rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5">Verified</span>
              </p>
            </div>
            <div className="text-3xl flex-shrink-0">✓</div>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="text-2xl">🏛️</span>
          <h2 className="text-xl font-bold text-slate-900">Academic Information</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Department - Enhanced */}
          <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 hover:border-slate-300 transition">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-2xl">🏢</span>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Department</p>
                <p className="mt-3 text-lg font-bold text-slate-900">{profile.department}</p>
                <p className="mt-2 text-xs text-slate-600">Academic unit assignment</p>
              </div>
            </div>
          </div>

          {/* Role - Enhanced */}
          <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 hover:border-slate-300 transition">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-2xl">👨‍💼</span>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">System Role</p>
                <p className="mt-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                    {profile.role === 'LECTURER' ? '👤 Lecturer' : '⚙️ Administrator'}
                  </span>
                </p>
                <p className="mt-2 text-xs text-slate-600">Portal access level</p>
              </div>
            </div>
          </div>

          {/* Account Status - Enhanced */}
          <div className="rounded-xl border-2 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 border-blue-200 hover:border-blue-300 transition md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <span className="mt-1 text-2xl">🔐</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Account Status</p>
                  <p className="mt-3">
                    {profile.onboarded ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
                        ✓ Active & Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800">
                        ⏳ Onboarding in Progress
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-xs text-blue-700">Your account is {profile.onboarded ? 'fully activated' : 'completing setup'}</p>
                </div>
              </div>
              <div className="text-4xl flex-shrink-0">{profile.onboarded ? '✓' : '⚠️'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Timeline */}
      <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="text-2xl">📅</span>
          <h2 className="text-xl font-bold text-slate-900">Account Timeline</h2>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300"></div>

          {/* Timeline Events */}
          <div className="space-y-6 pl-20">
            <div className="group relative">
              <div className="absolute left-0 top-2 h-12 w-12 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold group-hover:shadow-lg transition">
                📅
              </div>
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 group-hover:border-blue-200 transition">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Account Created</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {new Date(profile.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(profile.joinedAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8">
        <div className="flex gap-4">
          <div className="text-3xl flex-shrink-0">🤝</div>
          <div>
            <h3 className="font-bold text-slate-900">Need Profile Changes?</h3>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              For any changes to your official information (email, rank, department), please submit a request through the <strong>University HR Portal</strong> or contact:
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">📧</span>
                <span>hr@gctu.edu.gh</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span>HR Office, Administration Building (Room 201)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⏰</span>
                <span>Monday - Friday, 9:00 AM - 4:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <Link href="/lecturer-portal" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
