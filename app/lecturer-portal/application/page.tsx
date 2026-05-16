'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ApplicationData {
  requestId: number | null;
  currentRank: string;
  targetRank: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  status: string;
  scores: {
    researchScore: number | null;
    teachingScore: number | null;
    serviceScore: number | null;
    totalScore: number | null;
  };
  eligibilityStatus: string;
  adminComment: string | null;
}

export default function ApplicationPage() {
  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApplication() {
      try {
        const response = await fetch('/api/lecturer/application');
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load application');
        }

        setData(payload.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application data');
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          Loading application...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center font-medium text-blue-900 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!data || !data.requestId) {
    return (
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div>
            <div className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100">
              Active Application
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">No Active Application</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
              You don't have an active promotion application yet. Start by uploading your evidence.
            </p>
          </div>
        </section>

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Begin your promotion journey by submitting evidence in the Evidence Portfolio.</p>
          <Link href="/lecturer-portal/evidence" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Go to Evidence Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div>
          <div className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100">
            Active Application
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {data.currentRank} → {data.targetRank}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
            Your promotion application details and final eligibility determination.
          </p>
        </div>
      </section>

      {/* Application Status */}
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Application Status</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{data.status}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Eligibility</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{data.eligibilityStatus}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Submitted</p>
            <p className="mt-2 font-mono text-sm text-slate-700">
              {data.submittedAt ? new Date(data.submittedAt).toLocaleDateString() : 'Not submitted'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Verified</p>
            <p className="mt-2 font-mono text-sm text-slate-700">
              {data.verifiedAt ? new Date(data.verifiedAt).toLocaleDateString() : 'Pending'}
            </p>
          </div>
        </div>
      </div>

      {/* Final Scorecard */}
      {data.status === 'APPROVED' || data.status === 'REJECTED' || data.scores.totalScore !== null ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Final Scorecard</h2>
          <p className="mt-1 text-sm text-slate-600">Weighted performance scores across all categories</p>

          <div className="mt-6 space-y-4">
            {/* Research Score */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="font-semibold text-slate-900">Research Evidence (40%)</span>
                <span className="text-lg font-bold text-slate-900">{data.scores.researchScore?.toFixed(1) || 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: `${Math.min(data.scores.researchScore || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Teaching Score */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="font-semibold text-slate-900">Teaching Evidence (40%)</span>
                <span className="text-lg font-bold text-slate-900">{data.scores.teachingScore?.toFixed(1) || 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                  style={{ width: `${Math.min(data.scores.teachingScore || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Service Score */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="font-semibold text-slate-900">Service Evidence (20%)</span>
                <span className="text-lg font-bold text-slate-900">{data.scores.serviceScore?.toFixed(1) || 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-800"
                  style={{ width: `${Math.min(data.scores.serviceScore || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Total Score */}
            <div className="mt-6 rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Total Score</p>
              <p className="mt-2 text-4xl font-bold text-blue-900">{data.scores.totalScore?.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* HR Comment */}
      {data.adminComment && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-yellow-950">HR Admin Comment</h2>
          <p className="mt-3 text-blue-900">{data.adminComment}</p>
        </div>
      )}

      {/* Back Link */}
      <Link href="/lecturer-portal" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
