import Link from 'next/link';
import { RequestStatus, type Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import StatusBadge from '../../../components/promotion/StatusBadge';
import { prisma } from '../../../lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

const pendingDepartmentStatuses = [RequestStatus.SUBMITTED, RequestStatus.UNDER_DEPARTMENT_REVIEW];
const actionableStatuses = [...pendingDepartmentStatuses, RequestStatus.REQUIRES_FURTHER_REVIEW];
const forwardedStatuses = [
  RequestStatus.UNDER_HR_VERIFICATION,
  RequestStatus.UNDER_COMMITTEE_REVIEW,
  RequestStatus.ELIGIBLE,
  RequestStatus.NOT_ELIGIBLE,
  RequestStatus.RECOMMENDED,
  RequestStatus.NOT_RECOMMENDED,
  RequestStatus.APPROVED_BY_AUTHORITY,
  RequestStatus.APPROVED,
  RequestStatus.COMPLETED,
];

async function getDepartmentScopeWhere(): Promise<Prisma.PromotionRequestWhereInput> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (session?.role !== 'HOD_DEAN') {
    return {};
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      department: true,
      departmentId: true,
      facultyId: true,
    },
  });

  const lecturerFilters: Prisma.UserWhereInput[] = [];

  if (reviewer?.facultyId) {
    lecturerFilters.push({ facultyId: reviewer.facultyId });
  }

  if (reviewer?.departmentId) {
    lecturerFilters.push({ departmentId: reviewer.departmentId });
  }

  if (reviewer?.department || session.department) {
    lecturerFilters.push({ department: reviewer?.department || session.department });
  }

  return lecturerFilters.length > 0
    ? { lecturer: { OR: lecturerFilters } }
    : { lecturerId: -1 };
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

export default async function HodDashboardPage() {
  const scopeWhere = await getDepartmentScopeWhere();
  const [
    departmentApplications,
    pendingDepartmentReview,
    activeDepartmentAction,
    forwardedApplications,
    returnedForCorrection,
    recentApplications,
    recentComments,
    groupedStatuses,
  ] = await Promise.all([
    prisma.promotionRequest.count({ where: scopeWhere }),
    prisma.promotionRequest.count({ where: withStatuses(scopeWhere, pendingDepartmentStatuses) }),
    prisma.promotionRequest.count({ where: withStatuses(scopeWhere, actionableStatuses) }),
    prisma.promotionRequest.count({ where: withStatuses(scopeWhere, forwardedStatuses) }),
    prisma.promotionRequest.count({ where: { ...scopeWhere, status: RequestStatus.RETURNED_FOR_CORRECTION } }),
    prisma.promotionRequest.findMany({
      where: scopeWhere,
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
          is: scopeWhere,
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
      where: scopeWhere,
      _count: { _all: true },
    }),
  ]);

  const statusRows = groupedStatuses
    .map((row) => ({ label: label(row.status), value: row._count._all, status: row.status }))
    .sort((left, right) => right.value - left.value);

  return (
    <main className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">HOD / Dean Workspace</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Department Promotion Review</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Monitor department applications, act on submitted files, review recent comments, and forward complete promotion records to HR verification.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/hod/applications" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-900">
              Open Review Queue
            </Link>
            <Link href="/analytics" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900">
              Analytics
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile code="ALL" label="Department applications" value={departmentApplications} detail="All scoped records" tone="teal" />
        <MetricTile code="ACT" label="Active action" value={activeDepartmentAction} detail="Needs department attention" tone="amber" />
        <MetricTile code="PEN" label="Pending review" value={pendingDepartmentReview} detail="Submitted or in review" tone="slate" />
        <MetricTile code="FWD" label="Forwarded" value={forwardedApplications} detail="Moved beyond department" tone="green" />
        <MetricTile code="RET" label="Returned" value={returnedForCorrection} detail="Applicant corrections" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="pro-card overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Recent Department Applications</h2>
              <p className="mt-1 text-sm text-gray-600">Latest promotion files in your department or faculty scope.</p>
            </div>
            <Link href="/hod/applications" className="rounded-lg border border-teal-200 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50">
              View All
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="p-5">
              <EmptyPanel title="No department applications" description="Promotion files will appear here when lecturers in your scope submit applications." />
            </div>
          ) : (
            <div className="pro-scroll-x">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
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
                    const verifiedDocuments = application.documents.filter((document) => document.verificationStatus === 'VERIFIED').length;
                    const returnedDocuments = application.documents.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus)).length;
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
                        <td className="px-5 py-4"><StatusBadge status={application.status} /></td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{verifiedDocuments}/{application.documents.length} verified</p>
                          <p className={`mt-1 text-xs ${returnedDocuments ? 'text-orange-700' : 'text-gray-500'}`}>{returnedDocuments ? `${returnedDocuments} needs correction` : 'No correction flags'}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{formatDate(application.updatedAt)}</td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/hod/applications?request=${application.id}`} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800">
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
                <h2 className="text-lg font-bold text-gray-950">Application Status Summary</h2>
                <p className="mt-1 text-sm text-gray-600">Distribution of scoped promotion records.</p>
              </div>
              <span className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-teal-800">Live</span>
            </div>
            <div className="mt-5 space-y-3">
              {statusRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No status data available yet.</p>
              ) : (
                statusRows.map((row) => <StatusRow key={row.status} label={row.label} value={row.value} total={departmentApplications} />)
              )}
            </div>
          </section>

          <section className="pro-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Recent Recommendation Comments</h2>
                <p className="mt-1 text-sm text-gray-600">Latest formal review notes across your department files.</p>
              </div>
              <Link href="/hod/applications" className="text-sm font-semibold text-teal-800 hover:text-teal-900">Queue</Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentComments.length === 0 ? (
                <EmptyPanel title="No comments yet" description="Department comments will be listed once reviewers add notes." compact />
              ) : (
                recentComments.map((comment) => (
                  <article key={comment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-950">{applicationCode(comment.promotionRequest.id)} - {comment.promotionRequest.lecturer.name}</p>
                      <StatusBadge status={comment.promotionRequest.status} />
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-700">{comment.comment}</p>
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

function MetricTile({ code, label: title, value, detail, tone }: { code: string; label: string; value: number; detail: string; tone: 'teal' | 'amber' | 'green' | 'rose' | 'slate' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-950'
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

function StatusRow({ label: title, value, total }: { label: string; value: number; total: number }) {
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
