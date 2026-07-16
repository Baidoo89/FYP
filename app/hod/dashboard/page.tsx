import { RequestStatus, type Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { RoleDashboard } from '../../../components/RoleDashboard';
import { prisma } from '../../../lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

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

export default async function HodDashboardPage() {
  const scopeWhere = await getDepartmentScopeWhere();
  const withStatus = (status: RequestStatus): Prisma.PromotionRequestWhereInput => ({ ...scopeWhere, status });

  const [
    departmentApplications,
    pendingDepartmentReview,
    forwardedApplications,
    returnedForCorrection,
  ] = await Promise.all([
    prisma.promotionRequest.count({ where: scopeWhere }),
    prisma.promotionRequest.count({ where: withStatus(RequestStatus.UNDER_DEPARTMENT_REVIEW) }),
    prisma.promotionRequest.count({ where: withStatus(RequestStatus.UNDER_HR_VERIFICATION) }),
    prisma.promotionRequest.count({ where: withStatus(RequestStatus.RETURNED_FOR_CORRECTION) }),
  ]);

  return (
    <RoleDashboard
      eyebrow="HOD / Dean Workspace"
      title="Department Promotion Review"
      description="Review staff promotion applications from your academic area, record recommendations, request corrections, and forward complete applications for HR verification."
      metrics={[
        { label: 'Department applications', value: departmentApplications, tone: 'blue' },
        { label: 'Pending department review', value: pendingDepartmentReview, tone: 'amber' },
        { label: 'Forwarded to HR', value: forwardedApplications, tone: 'green' },
        { label: 'Returned for correction', value: returnedForCorrection, tone: 'red' },
      ]}
      actions={[
        { label: 'View applications', href: '/hod/applications' },
        { label: 'Promotion reports', href: '/analytics' },
      ]}
    />
  );
}
