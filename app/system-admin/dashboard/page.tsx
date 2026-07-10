import { RoleDashboard } from '../../../components/RoleDashboard';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SystemAdminDashboardPage() {
  const [totalUsers, activeUsers, departments, faculties, criteria, auditEvents] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.department.count(),
    prisma.faculty.count(),
    prisma.promotionCriteria.count({ where: { isActive: true } }),
    prisma.auditLog.count(),
  ]);

  return (
    <RoleDashboard
      eyebrow="System Administration"
      title="Platform Configuration and Governance"
      description="Manage institutional users, roles, departments, faculties, promotion criteria, verification settings, and system audit activity."
      metrics={[
        { label: 'Total users', value: totalUsers, tone: 'blue' },
        { label: 'Active users', value: activeUsers, tone: 'green' },
        { label: 'Departments / Faculties', value: `${departments} / ${faculties}`, tone: 'slate' },
        { label: 'Active criteria', value: criteria, tone: 'amber' },
        { label: 'Audit events', value: auditEvents, tone: 'slate' },
      ]}
      actions={[
        { label: 'User management', href: '/system-admin/users' },
        { label: 'Promotion criteria', href: '/system-admin/criteria' },
        { label: 'Faculties & departments', href: '/system-admin/structure' },
        { label: 'System settings', href: '/system-admin/settings' },
        { label: 'Audit logs', href: '/audit' },
        { label: 'Reports', href: '/analytics' },
      ]}
    />
  );
}
