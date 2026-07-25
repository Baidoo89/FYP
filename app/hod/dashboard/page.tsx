import Link from 'next/link';
import { RequestStatus, type Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock3, FileText, MessageSquareText, RotateCcw, Send } from 'lucide-react';
import StatusBadge from '../../../components/promotion/StatusBadge';
import { prisma } from '../../../lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../../../lib/auth';
import { getDepartmentReviewScope } from '../../../lib/department-scope';

export const dynamic = 'force-dynamic';

const pendingDepartmentStatuses: RequestStatus[] = [RequestStatus.SUBMITTED, RequestStatus.UNDER_DEPARTMENT_REVIEW];
const actionableStatuses: RequestStatus[] = [...pendingDepartmentStatuses, RequestStatus.REQUIRES_FURTHER_REVIEW];
const forwardedStatuses: RequestStatus[] = [
  RequestStatus.UNDER_HR_VERIFICATION,
  RequestStatus.UNDER_COMMITTEE_REVIEW,
  RequestStatus.ELIGIBLE,
  RequestStatus.NOT_ELIGIBLE,
  RequestStatus.RECOMMENDED,
  RequestStatus.NOT_RECOMMENDED,
  RequestStatus.APPROVED_BY_AUTHORITY,
  RequestStatus.APPROVED,
  RequestStatus.REJECTED,
  RequestStatus.COMPLETED,
];
const departmentVisibleStatuses: RequestStatus[] = [
  ...pendingDepartmentStatuses,
  RequestStatus.RETURNED_FOR_CORRECTION,
  RequestStatus.REQUIRES_FURTHER_REVIEW,
  ...forwardedStatuses,
];

async function getDepartmentScope() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  return getDepartmentReviewScope(prisma, {
    userId: session?.userId,
    role: session?.role,
    sessionDepartment: session?.department,
  });
}

function withStatuses(scopeWhere: Prisma.PromotionRequestWhereInput, statuses: RequestStatus[]): Prisma.PromotionRequestWhereInput {
  return { ...scopeWhere, status: { in: statuses } };
}

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

function documentCounts(documents: Array<{ verificationStatus: string }>) {
  return {
    total: documents.length,
    verified: documents.filter((document) => document.verificationStatus === 'VERIFIED').length,
    returned: documents.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus)).length,
    pending: documents.filter((document) => document.verificationStatus === 'PENDING').length,
  };
}

export default async function HodDashboardPage() {
  const scope = await getDepartmentScope();
  const scopeWhere = scope.where;
  const visibleScopeWhere = withStatuses(scopeWhere, departmentVisibleStatuses);
  const [
    departmentApplications,
    pendingDepartmentReview,
    activeDepartmentAction,
    forwardedApplications,
    returnedForCorrection,
    furtherReview,
    recentApplications,
    recentComments,
    groupedStatuses,
  ] = await Promise.all([
    prisma.promotionRequest.count({ where: visibleScopeWhere }),
    prisma.promotionRequest.count({ where: withStatuses(scopeWhere, pendingDepartmentStatuses) }),
    prisma.promotionRequest.count({ where: withStatuses(scopeWhere, actionableStatuses) }),
    prisma.promotionRequest.count({ where: withStatuses(scopeWhere, forwardedStatuses) }),
    prisma.promotionRequest.count({ where: { ...scopeWhere, status: RequestStatus.RETURNED_FOR_CORRECTION } }),
    prisma.promotionRequest.count({ where: { ...scopeWhere, status: RequestStatus.REQUIRES_FURTHER_REVIEW } }),
    prisma.promotionRequest.findMany({
      where: visibleScopeWhere,
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
        promotionRequest: {
          is: visibleScopeWhere,
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
      by: ['status'],
      where: visibleScopeWhere,
      _count: { _all: true },
    }),
  ]);

  const statusRows = groupedStatuses
    .map((row) => ({ label: label(row.status), value: row._count._all, status: row.status }))
    .sort((left, right) => right.value - left.value);

  const actionBanner = activeDepartmentAction > 0
    ? {
        title: `${activeDepartmentAction} application${activeDepartmentAction === 1 ? '' : 's'} need department action`,
        detail: 'Review submitted files, add a formal department comment, then forward complete applications to HR or return incomplete records for correction.',
        href: '/hod/review-queue',
        tone: 'amber' as const,
      }
    : {
        title: 'No department action waiting',
        detail: 'Your review queue is clear. Continue monitoring forwarded applications and recent recommendation comments.',
        href: '/hod/records',
        tone: 'green' as const,
      };

  return (
    <main className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <section className="relative overflow-hidden rounded-xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] xl:items-center">
          <div className="min-w-0">
            <div className="pro-eyebrow">HOD / Dean Workspace</div>
            <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">Department Promotion Review</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Monitor scoped promotion files, record department recommendations, return incomplete applications, and forward complete records to HR verification.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/hod/review-queue" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark">
                Open Review Queue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-white text-brand-primary">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Review Scope</p>
                <h2 className="mt-1 break-words text-base font-semibold text-gray-950">{scope.scopeLabel}</h2>
                <p className="mt-1 break-words text-sm leading-6 text-gray-600">{scope.scopeDetail}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <ScopeLine label="Department" value={scope.reviewer?.departmentRef?.name || scope.reviewer?.department || scope.scopeLabel} />
              <ScopeLine label="Faculty" value={scope.reviewer?.faculty?.name || 'Not assigned'} />
              <ScopeLine label="Reviewer" value={scope.reviewer?.name || 'Authorized reviewer'} />
              <ScopeLine label="Last update" value={formatDate(recentApplications[0]?.updatedAt)} />
            </div>
          </aside>
        </div>
      </section>

      <ActionBanner {...actionBanner} />

      <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricTile icon={FileText} label="Scoped Applications" value={departmentApplications} detail="Department/faculty records" tone="blue" />
        <MetricTile icon={AlertTriangle} label="Active Action" value={activeDepartmentAction} detail="Needs department decision" tone="amber" />
        <MetricTile icon={Clock3} label="Department Pending" value={pendingDepartmentReview} detail="Still with department" tone="slate" />
        <MetricTile icon={Send} label="Forwarded" value={forwardedApplications} detail="Moved beyond department" tone="green" />
        <MetricTile icon={RotateCcw} label="Returned / Further" value={returnedForCorrection + furtherReview} detail="Corrections or review holds" tone="rose" />
      </section>

      <section className="grid min-w-0 max-w-full gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <div className="pro-card min-w-0 overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-bold text-gray-950">Recent Department Applications</h2>
              <p className="mt-1 text-sm text-gray-600">Latest promotion files in your department or faculty scope.</p>
            </div>
            <Link href="/hod/records" className="inline-flex min-h-9 w-fit items-center rounded-lg border border-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primarySoft">
              View All
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="p-5">
              <EmptyPanel title="No department applications" description="Promotion files will appear here when lecturers in your scope submit applications." />
            </div>
          ) : (
            <div className="pro-scroll-x">
              <table className="min-w-[920px] divide-y divide-gray-100 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Application</th>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Evidence</th>
                    <th className="px-5 py-3">Updated</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {recentApplications.map((application) => {
                    const counts = documentCounts(application.documents);
                    return (
                      <tr key={application.id} className="align-top transition hover:bg-gray-50/80">
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-950">{applicationCode(application.id)}</p>
                          <p className="mt-1 text-xs text-gray-500">{label(application.currentRank)} to {label(application.targetRank)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{application.lecturer.name}</p>
                          <p className="mt-1 text-xs text-gray-500">{application.lecturer.department || application.lecturer.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <StatusBadge status={application.status} />
                            <ReviewSignal status={application.status} counts={counts} />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{counts.total} document{counts.total === 1 ? '' : 's'}</p>
                          <p className={`mt-1 text-xs ${counts.returned ? 'text-orange-700' : 'text-gray-500'}`}>{counts.returned ? `${counts.returned} returned by HR` : counts.verified ? `${counts.verified} HR verified` : `${counts.pending} awaiting HR check`}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{formatDate(application.updatedAt)}</td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/hod/review-queue?request=${application.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-brand-primary/20 hover:bg-brand-primarySoft hover:text-brand-primary" aria-label={`Open ${applicationCode(application.id)}`}>
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

        <div className="min-w-0 space-y-5">
          <section className="pro-card min-w-0 p-5">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold text-gray-950">Application Status Summary</h2>
                <p className="mt-1 text-sm text-gray-600">Distribution of scoped promotion records.</p>
              </div>
              <span className="rounded-lg border border-brand-primary/20 bg-brand-primarySoft px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-brand-primary">Live</span>
            </div>
            <div className="mt-5 space-y-3">
              {statusRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No status data available yet.</p>
              ) : (
                statusRows.map((row) => <StatusRow key={row.status} label={row.label} value={row.value} total={departmentApplications} status={row.status} />)
              )}
            </div>
          </section>

          <section className="pro-card min-w-0 p-5">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold text-gray-950">Recent Recommendation Comments</h2>
                <p className="mt-1 text-sm text-gray-600">Latest formal review notes across department files.</p>
              </div>
              <MessageSquareText className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 space-y-3">
              {recentComments.length === 0 ? (
                <EmptyPanel title="No comments yet" description="Department comments will be listed once reviewers add notes." compact />
              ) : (
                recentComments.map((comment) => (
                  <article key={comment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="break-words text-sm font-bold text-gray-950">{applicationCode(comment.promotionRequest.id)} - {comment.promotionRequest.lecturer.name}</p>
                      <StatusBadge status={comment.promotionRequest.status} />
                    </div>
                    <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-gray-700">{comment.comment}</p>
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      {comment.reviewer.name} ({label(comment.reviewer.role)}) - {formatDate(comment.createdAt)}
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

function reviewSignalFor(status: RequestStatus, counts: ReturnType<typeof documentCounts>) {
  if (status === RequestStatus.RETURNED_FOR_CORRECTION || counts.returned > 0) {
    return { label: 'Returned', className: 'border-rose-200 bg-rose-50 text-rose-800' };
  }

  if (status === RequestStatus.SUBMITTED || status === RequestStatus.UNDER_DEPARTMENT_REVIEW) {
    return { label: 'Under Review', className: 'border-amber-200 bg-amber-50 text-amber-900' };
  }

  if (status === RequestStatus.UNDER_HR_VERIFICATION) {
    return { label: 'With HR', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  }

  if (forwardedStatuses.includes(status)) {
    return { label: 'Forwarded', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  }

  return { label: 'Monitoring', className: 'border-slate-200 bg-slate-50 text-slate-700' };
}

function ReviewSignal({ status, counts }: { status: RequestStatus; counts: ReturnType<typeof documentCounts> }) {
  const signal = reviewSignalFor(status, counts);

  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${signal.className}`}>
      {signal.label}
    </span>
  );
}

function ScopeLine({ label: title, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{title}</span>
      <span className="min-w-0 truncate text-right text-xs font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function ActionBanner({ title, detail, href, tone }: { title: string; detail: string; href: string; tone: 'amber' | 'green' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : 'border-emerald-200 bg-emerald-50 text-emerald-950';
  const Icon = tone === 'amber' ? AlertTriangle : CheckCircle2;

  return (
    <section role="status" aria-live="polite" className={`flex min-w-0 max-w-full flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${toneClass}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{title}</p>
          <p className="mt-1 break-words text-xs leading-5 opacity-80">{detail}</p>
        </div>
      </div>
      <Link href={href} className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 sm:w-auto">
        Open queue
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

function MetricTile({ icon: Icon, label: title, value, detail, tone }: { icon: LucideIcon; label: string; value: number; detail: string; tone: 'blue' | 'amber' | 'green' | 'rose' | 'slate' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-950'
        : tone === 'slate'
          ? 'border-slate-200 bg-white text-slate-950'
          : 'border-brand-primary/20 bg-brand-primarySoft text-brand-text';

  return (
    <article className={`min-w-0 rounded-xl border p-4 shadow-sm sm:p-5 ${toneClass}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.14em] opacity-70">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
          <p className="mt-1 truncate text-xs opacity-75">{detail}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-white/70">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function StatusRow({ label: title, value, total, status }: { label: string; value: number; total: number; status: RequestStatus }) {
  const width = total > 0 ? Math.max(6, Math.round((value / total) * 100)) : 0;
  const barClass = status === RequestStatus.RETURNED_FOR_CORRECTION || status === RequestStatus.REQUIRES_FURTHER_REVIEW
    ? 'bg-amber-500'
    : forwardedStatuses.includes(status)
      ? 'bg-emerald-600'
      : pendingDepartmentStatuses.includes(status)
        ? 'bg-brand-primary'
        : 'bg-slate-600';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
        <span className="break-words">{title}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
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
