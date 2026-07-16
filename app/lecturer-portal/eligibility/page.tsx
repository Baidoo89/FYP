'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '../../../components/promotion/StatusBadge';
import { EmptyState, ErrorState, LoadingState, SectionCard } from '../../../components/enterprise-ui';

type EvidenceDocument = {
  id: number;
  title: string;
  fileUrl?: string;
  verificationStatus: string;
  verificationComment?: string | null;
  uploadedAt?: string;
};

type CategoryStatus = {
  category: string;
  required: boolean;
  uploaded: boolean;
  status: string;
  document?: EvidenceDocument | null;
};

type EligibilityData = {
  request: {
    id: number;
    currentRank: string;
    targetRank: string;
    status: string;
    eligibilityStatus: string;
    eligibilityReason?: string | null;
    totalScore?: number | null;
    yearsInCurrentRank?: number | null;
    updatedAt?: string;
  } | null;
  currentRank: string;
  targetRank: string;
  criteria?: {
    requiredDocumentCategories: string[];
    minimumYearsInCurrentRank: number;
    minimumTotalScore?: number | null;
    publicationRequirement?: string | null;
    professionalDevelopmentRequirement?: string | null;
  } | null;
  requiredCategories: string[];
  categoryStatus: CategoryStatus[];
  stats: {
    totalDocuments: number;
    requiredCategories: number;
    requiredUploadedCount: number;
    requiredVerifiedCount: number;
    verifiedCount: number;
    pendingCount: number;
    returnedCount: number;
    rejectedCount: number;
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

function nextAction(data: EligibilityData) {
  const stats = data.stats;
  if (!data.request) {
    return {
      title: 'Start with evidence upload',
      detail: 'Upload the required evidence categories to create a draft promotion request.',
      href: '/lecturer-portal/evidence',
      label: 'Upload Evidence',
    };
  }

  if (stats.returnedCount > 0 || stats.rejectedCount > 0 || data.request.status === 'RETURNED_FOR_CORRECTION') {
    return {
      title: 'Resolve returned evidence',
      detail: 'Open the evidence portfolio, read the HR comment, and replace the affected document.',
      href: '/lecturer-portal/evidence',
      label: 'Fix Evidence',
    };
  }

  if (stats.requiredVerifiedCount < stats.requiredCategories) {
    return {
      title: 'Complete verified requirements',
      detail: `${Math.max(stats.requiredCategories - stats.requiredVerifiedCount, 0)} required evidence category/categories still need verified documents.`,
      href: '/lecturer-portal/evidence',
      label: 'View Evidence',
    };
  }

  if (data.request.eligibilityStatus === 'ELIGIBLE') {
    return {
      title: 'Ready for committee decision',
      detail: 'Your required evidence is verified and eligibility has been calculated as eligible.',
      href: '/lecturer-portal/application',
      label: 'Track Application',
    };
  }

  return {
    title: 'Track administrative updates',
    detail: 'Eligibility is dependent on HR verification, criteria checks, and formal workflow status.',
    href: '/lecturer-portal/application',
    label: 'Track Application',
  };
}

export default function EligibilityPage() {
  const [data, setData] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEligibility() {
      try {
        const response = await fetch('/api/lecturer/evidence', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load eligibility data');
        }

        setData(payload.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load eligibility data');
      } finally {
        setLoading(false);
      }
    }

    loadEligibility();
  }, []);

  const requiredRows = useMemo(() => data?.categoryStatus.filter((row) => row.required) || [], [data]);

  if (loading) return <LoadingState label="Loading eligibility status..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="Eligibility data unavailable" description="Refresh the page or contact HR if the issue continues." />;

  const stats = data.stats;
  const readiness = stats.requiredCategories > 0 ? Math.round((stats.requiredVerifiedCount / stats.requiredCategories) * 100) : 0;
  const action = nextAction(data);
  const eligibilityStatus = data.request?.eligibilityStatus || (stats.requiredVerifiedCount === stats.requiredCategories ? 'PENDING_REVIEW' : 'INCOMPLETE_APPLICATION');

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Promotion Readiness</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Eligibility Status</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Live eligibility view for your {label(data.currentRank)} to {label(data.targetRank)} promotion pathway.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={eligibilityStatus} />
            {data.request && <StatusBadge status={data.request.status} />}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard code="RD" label="Readiness" value={`${readiness}%`} detail="Required evidence verified" tone="teal" />
        <MetricCard code="REQ" label="Required Verified" value={`${stats.requiredVerifiedCount}/${stats.requiredCategories}`} detail="Core categories" tone="green" />
        <MetricCard code="PEN" label="Pending Review" value={stats.pendingCount} detail="Awaiting HR decision" tone="amber" />
        <MetricCard code="RET" label="Returned" value={stats.returnedCount + stats.rejectedCount} detail="Needs correction" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Required Evidence Status" description="Eligibility can only be calculated after required categories have verified evidence.">
          <div className="space-y-3">
            {requiredRows.map((row) => (
              <div key={row.category} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-semibold text-gray-950">{label(row.category)}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {row.document?.title || 'No document uploaded for this required category yet.'}
                    </p>
                    {row.document?.verificationComment && (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">{row.document.verificationComment}</p>
                    )}
                  </div>
                  <StatusBadge status={row.status === 'MISSING' ? 'INCOMPLETE_APPLICATION' : row.status} label={row.status === 'MISSING' ? 'Missing' : undefined} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Next Required Action" description={action.detail} action={<Link href={action.href} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">{action.label}</Link>}>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-950">{action.title}</div>
          </SectionCard>

          <SectionCard title="Criteria Snapshot" description="Current active criteria configured by the system administrator.">
            <div className="grid gap-3 text-sm text-gray-700">
              <InfoRow label="Minimum years in rank" value={`${data.criteria?.minimumYearsInCurrentRank ?? 0} year(s)`} />
              <InfoRow label="Minimum score" value={data.criteria?.minimumTotalScore ? `${data.criteria.minimumTotalScore}%` : 'Not configured'} />
              <InfoRow label="Your score" value={data.request?.totalScore ? `${data.request.totalScore}%` : 'Awaiting calculation'} />
              <InfoRow label="Last updated" value={formatDate(data.request?.updatedAt)} />
            </div>
          </SectionCard>
        </div>
      </section>

      <SectionCard title="Eligibility Notes" description="Formal decision support generated from verified evidence and configured promotion criteria.">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-7 text-gray-700">
          {data.request?.eligibilityReason || 'Eligibility will be calculated after the required evidence has been uploaded and verified by HR.'}
        </div>
      </SectionCard>
    </div>
  );
}

function MetricCard({ code, label, value, detail, tone }: { code: string; label: string; value: string | number; detail: string; tone: 'teal' | 'green' | 'amber' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-teal-200 bg-teal-50 text-teal-900';

  return (
    <div className="pro-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-950">{value}</span>
    </div>
  );
}
