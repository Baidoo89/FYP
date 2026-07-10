import { RequestStatus } from '@prisma/client';
import { RoleDashboard } from '../../../components/RoleDashboard';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CommitteeDashboardPage() {
  const [assignedApplications, pendingReview, recommended, requiresFurtherReview] = await Promise.all([
    prisma.promotionRequest.count({ where: { status: RequestStatus.UNDER_COMMITTEE_REVIEW } }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.UNDER_COMMITTEE_REVIEW } }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.RECOMMENDED } }),
    prisma.promotionRequest.count({ where: { status: RequestStatus.REQUIRES_FURTHER_REVIEW } }),
  ]);

  return (
    <RoleDashboard
      eyebrow="Committee Review Workspace"
      title="Verified Application Review"
      description="Review HR-verified promotion applications, examine supporting evidence, consider eligibility recommendations, and record formal committee recommendations."
      metrics={[
        { label: 'Assigned applications', value: assignedApplications, tone: 'blue' },
        { label: 'Pending review', value: pendingReview, tone: 'amber' },
        { label: 'Recommended', value: recommended, tone: 'green' },
        { label: 'Requires further review', value: requiresFurtherReview, tone: 'slate' },
      ]}
      actions={[
        { label: 'Review applications', href: '/committee/review' },
        { label: 'Review history', href: '/audit' },
      ]}
    />
  );
}
