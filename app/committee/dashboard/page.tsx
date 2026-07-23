import Link from 'next/link';
import { RequestStatus } from '@prisma/client';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, FileCheck2, FileText, MessageSquareText, ShieldCheck } from 'lucide-react';
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

function priorityFor(status: RequestStatus, updatedAt: Date) {
  const ageDays = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 86_400_000));

  if (status === RequestStatus.UNDER_COMMITTEE_REVIEW && ageDays >= 7) {
    return { label: 'Urgent', className: 'border-rose-200 bg-rose-50 text-rose-800' };
  }

  if (status === RequestStatus.UNDER_COMMITTEE_REVIEW && ageDays >= 3) {
    return { label: 'Due Soon', className: 'border-amber-200 bg-amber-50 text-amber-800' };
  }

  if (status === RequestStatus.REQUIRES_FURTHER_REVIEW) {
    return { label: 'Clarification', className: 'border-sky-200 bg-sky-50 text-sky-800' };
  }

  return { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
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
            category: true,
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
      take: 7,
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

  const activeFile = recentApplications.find((application) => application.status === RequestStatus.UNDER_COMMITTEE_REVIEW) || recentApplications[0] || null;
  const decisionRate = assignedApplications > 0 ? Math.round((reviewedApplications / assignedApplications) * 100) : 0;

  return (
    <main className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <section className="relative overflow-hidden rounded-xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="pro-eyebrow">Committee Review Workspace</div>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">Verified Application Review Board</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Review HR-verified promotion files, inspect evidence readiness, compare eligibility outcomes, and record formal committee recommendations.
            </p>
          </div>
          <Link href="/committee/review?segment=pending" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark sm:w-auto">
            Open Review Queue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {pendingReview > 0 && activeFile && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm" role="status" aria-live="polite">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-white/70">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-bold">Committee action required</p>
                <p className="mt-1 break-words text-sm leading-6 opacity-85">
                  {pendingReview} verified application{pendingReview === 1 ? '' : 's'} need committee recommendation. Start with {applicationCode(activeFile.id)} for {activeFile.lecturer.name}.
                </p>
              </div>
            </div>
            <Link href={`/committee/review?request=${activeFile.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-current/20 bg-white/80 px-4 py-2 text-sm font-bold text-amber-950 transition hover:bg-white">
              Review File
            </Link>
          </div>
        </section>
      )}

      <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricTile icon={ClipboardCheck} label="Assigned Files" value={assignedApplications} detail="Committee scope" tone="brand" />
        <MetricTile icon={Clock3} label="Pending Review" value={pendingReview} detail="Decision needed" tone="amber" />
        <MetricTile icon={CheckCircle2} label="Reviewed" value={reviewedApplications} detail={`${decisionRate}% completed`} tone="slate" />
        <MetricTile icon={ShieldCheck} label="Recommended" value={recommended} detail="Supported" tone="green" />
        <MetricTile icon={AlertTriangle} label="Not Recommended" value={notRecommended} detail="Declined" tone="rose" />
        <MetricTile icon={FileText} label="Further Review" value={requiresFurtherReview} detail="Clarification" tone="blue" />
      </section>

      <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]">
        <div className="pro-card min-w-0 overflow-hidden">
          <div className="flex min-w-0 flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-950">Committee Application Queue</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">Latest verified or committee-stage promotion files, with priority and review status.</p>
            </div>
            <Link href="/committee/review?segment=all" className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primarySoft">
              View All
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="p-5">
              <EmptyPanel title="No committee applications" description="HR-verified promotion files will appear here once routed to committee review." />
            </div>
          ) : (
            <div className="pro-scroll-x">
              <table className="min-w-[900px] divide-y divide-gray-100 text-left text-sm">
                <thead className="brand-table-head bg-gray-50 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Application</th>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Readiness</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {recentApplications.map((application) => {
                    const verifiedDocuments = application.documents.filter((document) => document.verificationStatus === 'VERIFIED').length;
                    const categories = new Set(application.documents.map((document) => document.category));
                    const priority = priorityFor(application.status, application.updatedAt);
                    return (
                      <tr key={application.id} className="align-top transition hover:bg-gray-50/80">
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-950">{applicationCode(application.id)}</p>
                          <p className="mt-1 text-xs text-gray-500">Updated {formatDate(application.updatedAt)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{application.lecturer.name}</p>
                          <p className="mt-1 text-xs text-gray-500">Department: {application.lecturer.department || 'Not assigned'}</p>
                          <p className="mt-1 text-xs text-gray-500">{label(application.currentRank)} to {label(application.targetRank)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{verifiedDocuments}/{application.documents.length} verified</p>
                          <p className="mt-1 text-xs text-gray-500">{categories.size} evidence categories</p>
                          <StatusBadge status={application.eligibilityStatus || 'PENDING'} />
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${priority.className}`}>{priority.label}</span>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={application.status} /></td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/committee/review?request=${application.id}`} className="inline-flex items-center justify-end gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-brand-primary/25 hover:bg-brand-primarySoft hover:text-brand-primary">
                            Open
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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

        <div className="space-y-5">
          <section className="pro-card min-w-0 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primarySoft text-brand-primary">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-950">Eligibility Outcomes</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">Server-calculated eligibility profile for committee-stage files.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {eligibilityRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No eligibility data available yet.</p>
              ) : (
                eligibilityRows.map((row) => <ProgressRow key={row.label} label={row.label} value={row.value} total={assignedApplications} />)
              )}
            </div>
          </section>

          <section className="pro-card min-w-0 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primarySoft text-brand-primary">
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-950">Recommendation Summary</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">Latest formal committee decisions and rationale.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {recentRecommendations.length === 0 ? (
                <EmptyPanel title="No recommendations yet" description="Committee recommendations will appear after reviewers submit decisions." compact />
              ) : (
                recentRecommendations.map((review) => (
                  <article key={review.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="break-words text-sm font-bold text-gray-950">{applicationCode(review.promotionRequest.id)} - {review.promotionRequest.lecturer.name}</p>
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

function MetricTile({ icon: Icon, label: title, value, detail, tone }: { icon: typeof ClipboardCheck; label: string; value: number; detail: string; tone: 'brand' | 'amber' | 'green' | 'rose' | 'slate' | 'blue' }) {
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
            : 'border-brand-primary/15 bg-brand-primarySoft text-brand-primary';

  return (
    <article className={`min-w-0 rounded-xl border p-4 shadow-sm sm:p-5 ${toneClass}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-white/70">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
          <p className="mt-1 text-xs opacity-75">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function ProgressRow({ label: title, value, total }: { label: string; value: number; total: number }) {
  const width = total > 0 ? Math.max(6, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
        <span className="break-words">{title}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${width}%` }} />
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