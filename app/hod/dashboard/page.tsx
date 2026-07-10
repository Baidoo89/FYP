import { RequestStatus } from '@prisma/client';
import { RoleDashboard } from '../../../components/RoleDashboard';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HodDashboardPage() {
  const [
    departmentApplications,
    pendingDepartmentReview,
    forwardedApplications,
    returnedForCorrection,
  ] = await Promise.all([
    prisma.promotionRequest.count(),
    prisma.promotionRequest.count({ where: { status: RequestStatus.UNDER_DEPARTMENT_REVIEW } }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.UNDER_HR_VERIFICATION } }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.RETURNED_FOR_CORRECTION } }),
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
