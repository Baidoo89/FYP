import Link from 'next/link';
import { RequestStatus } from '@prisma/client';
import StatusBadge from '../../../components/promotion/StatusBadge';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

const committeeStatuses = [
  RequestStatus.UNDER_COMMITTEE_REVIEW,
  RequestStatus.RECOMMENDED,
  RequestStatus.NOT_RECOMMENDED,
  RequestStatus.REQUIRES_FURTHER_REVIEW,
  RequestStatus.APPROVED_BY_AUTHORITY,
  RequestStatus.APPROVED,
  RequestStatus.COMPLETED,
];

const reviewedStatuses = [
  RequestStatus.RECOMMENDED,
  RequestStatus.NOT_RECOMMENDED,
  RequestStatus.APPROVED_BY_AUTHORITY,
  RequestStatus.APPROVED,
  RequestStatus.COMPLETED,
];

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: Date | string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

export default async function CommitteeDashboardPage() {
  const committeeWhere = { status: { in: committeeStatuses } };

  const [
    assignedApplications,
    pendingReview,
    reviewedApplications,
    recommended,
    notRecommended,
    requiresFurtherReview,
    recentApplications,
    recentRecommendations,
    eligibilityOutcomes,
  ] = await Promise.all([
    prisma.promotionRequest.count({ where: committeeWhere }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.UNDER_COMMITTEE_REVIEW } }),
    prisma.promotionRequest.count({ where: { status: { in: reviewedStatuses } } }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.RECOMMENDED } }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.NOT_RECOMMENDED } }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.REQUIRES_FURTHER_REVIEW } }),
    prisma.promotionRequest.findMany({
      where: committeeWhere,
      include: {
        lecturer: {
          select: {
            name: true,
            email: true,
            department: true,
          },
        },
        documents: {
          select: {
            verificationStatus: true,
          },
        },
        reviewComments: {
          include: {
            reviewer: {
              select: {
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.reviewComment.findMany({
      where: {
        recommendation: { not: null },
        promotionRequest: {
          is: committeeWhere,
        },
      },
      include: {
        reviewer: {
          select: {
            name: true,
            role: true,
          },
        },
        promotionRequest: {
          select: {
            id: true,
            status: true,
            eligibilityStatus: true,
            lecturer: {
              select: {
                name: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.promotionRequest.groupBy({
      by: ['eligibilityStatus'],
      where: committeeWhere,
      _count: { _all: true },
    }),
  ]);

  const eligibilityRows = eligibilityOutcomes
    .map((row) => ({ label: label(row.eligibilityStatus), value: row._count._all }))
    .sort((left, right) => right.value - left.value);

  return (
    <main className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Committee Review Workspace</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Verified Application Review</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Review HR-verified promotion applications, compare evidence readiness, inspect eligibility outcomes, and record formal committee recommendations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/committee/review" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-900">
              Open Review Board
            </Link>
            <Link href="/analytics" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900">
              Analytics
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricTile code="ASN" label="Assigned applications" value={assignedApplications} detail="Committee-visible files" tone="teal" />
        <MetricTile code="PEN" label="Pending review" value={pendingReview} detail="Awaiting decision" tone="amber" />
        <MetricTile code="REV" label="Reviewed" value={reviewedApplications} detail="Recommendation recorded" tone="slate" />
        <MetricTile code="REC" label="Recommended" value={recommended} detail="Supported by committee" tone="green" />
        <MetricTile code="NR" label="Not recommended" value={notRecommended} detail="Not supported" tone="rose" />
        <MetricTile code="FR" label="Further review" value={requiresFurtherReview} detail="Clarification needed" tone="blue" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="pro-card overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Committee Application Queue</h2>
              <p className="mt-1 text-sm text-gray-600">Latest verified or committee-stage promotion files.</p>
            </div>
            <Link href="/committee/review" className="rounded-lg border border-teal-200 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50">
              View Board
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="p-5">
              <EmptyPanel title="No committee applications" description="HR-verified promotion files will appear here once routed to committee review." />
            </div>
          ) : (
            <div className="pro-scroll-x">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Application</th>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Eligibility</th>
                    <th className="px-5 py-3">Evidence</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {recentApplications.map((application) => {
                    const verifiedDocuments = application.documents.filter((document) => document.verificationStatus === 'VERIFIED').length;
                    return (
                      <tr key={application.id} className="align-top hover:bg-gray-50/80">
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-950">{applicationCode(application.id)}</p>
                          <p className="mt-1 text-xs text-gray-500">{label(application.currentRank)} to {label(application.targetRank)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{application.lecturer.name}</p>
                          <p className="mt-1 text-xs text-gray-500">{application.lecturer.department || application.lecturer.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={application.eligibilityStatus} />
                          <p className="mt-2 text-xs text-gray-500">Score {application.totalScore ?? 'N/A'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{verifiedDocuments}/{application.documents.length} verified</p>
                          <p className="mt-1 text-xs text-gray-500">Evidence package</p>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={application.status} /></td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/committee/review?request=${application.id}`} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800">
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="pro-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Eligibility Outcomes</h2>
                <p className="mt-1 text-sm text-gray-600">Server-calculated eligibility profile for committee-stage files.</p>
              </div>
              <span className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-teal-800">Live</span>
            </div>
            <div className="mt-5 space-y-3">
              {eligibilityRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No eligibility data available yet.</p>
              ) : (
                eligibilityRows.map((row) => <ProgressRow key={row.label} label={row.label} value={row.value} total={assignedApplications} />)
              )}
            </div>
          </section>

          <section className="pro-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Recommendation Summary</h2>
                <p className="mt-1 text-sm text-gray-600">Latest formal committee decisions and rationale.</p>
              </div>
              <Link href="/committee/review" className="text-sm font-semibold text-teal-800 hover:text-teal-900">Review</Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentRecommendations.length === 0 ? (
                <EmptyPanel title="No recommendations yet" description="Committee recommendations will appear after reviewers submit decisions." compact />
              ) : (
                recentRecommendations.map((review) => (
                  <article key={review.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-950">{applicationCode(review.promotionRequest.id)} - {review.promotionRequest.lecturer.name}</p>
                      <StatusBadge status={review.recommendation || review.promotionRequest.status} />
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-700">{review.comment}</p>
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      {review.reviewer.name} ({label(review.reviewer.role)}) - {formatDate(review.createdAt)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricTile({ code, label: title, value, detail, tone }: { code: string; label: string; value: number; detail: string; tone: 'teal' | 'amber' | 'green' | 'rose' | 'slate' | 'blue' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-950'
        : tone === 'blue'
          ? 'border-sky-200 bg-sky-50 text-sky-950'
          : tone === 'slate'
            ? 'border-slate-200 bg-white text-slate-950'
            : 'border-teal-200 bg-teal-50 text-teal-950';

  return (
    <article className={`rounded-xl border p-5 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs opacity-75">{detail}</p>
        </div>
        <span className="rounded-lg border border-current/15 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]">{code}</span>
      </div>
    </article>
  );
}

function ProgressRow({ label: title, value, total }: { label: string; value: number; total: number }) {
  const width = total > 0 ? Math.max(6, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
        <span>{title}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-teal-700" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyPanel({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center ${compact ? 'p-4' : 'p-6'}`}>
      <p className="font-semibold text-gray-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">{description}</p>
    </div>
  );
}
