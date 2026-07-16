import Link from 'next/link';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

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

function roleTone(role: string) {
  if (role === 'SYSTEM_ADMIN') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (role === 'HR_ADMIN') return 'border-teal-200 bg-teal-50 text-teal-800';
  if (role === 'HOD_DEAN') return 'border-sky-200 bg-sky-50 text-sky-800';
  if (role === 'COMMITTEE_REVIEWER') return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  return 'border-gray-200 bg-gray-50 text-gray-700';
}

function criteriaCode(currentRank: string, targetRank: string) {
  return `${currentRank.slice(0, 3)}-${targetRank.slice(0, 3)}`;
}

export default async function SystemAdminDashboardPage() {
  const [
    totalUsers,
    activeUsers,
    unverifiedUsers,
    notOnboardedUsers,
    departments,
    faculties,
    activeCriteria,
    auditEvents,
    roleGroups,
    recentUsers,
    structureRows,
    recentCriteria,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { emailVerified: false } }),
    prisma.user.count({ where: { onboarded: false } }),
    prisma.department.count(),
    prisma.faculty.count(),
    prisma.promotionCriteria.count({ where: { isActive: true } }),
    prisma.auditLog.count(),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true }, orderBy: { role: 'asc' } }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        emailVerified: true,
        onboarded: true,
        createdAt: true,
        departmentRef: { select: { name: true } },
        faculty: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.faculty.findMany({
      include: {
        _count: {
          select: {
            departments: true,
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 6,
    }),
    prisma.promotionCriteria.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  const inactiveUsers = totalUsers - activeUsers;
  const accountHealth = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const roleRows = roleGroups.map((row) => ({ role: row.role, value: row._count._all }));

  return (
    <main className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">System Administration</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Platform Configuration and Governance</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Govern staff accounts, role access, institutional structure, promotion criteria, and audit activity across the GCTU Digital Staff Promotion Support System.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/system-admin/users" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-900">
              Manage Users
            </Link>
            <Link href="/audit" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900">
              Audit Logs
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricTile code="USR" label="Total users" value={totalUsers} detail="All accounts" tone="teal" />
        <MetricTile code="ACT" label="Active users" value={activeUsers} detail={`${accountHealth}% active`} tone="green" />
        <MetricTile code="INA" label="Inactive" value={inactiveUsers} detail="Disabled accounts" tone="rose" />
        <MetricTile code="VER" label="Unverified" value={unverifiedUsers} detail="Email pending" tone="amber" />
        <MetricTile code="STR" label="Departments / Faculties" value={`${departments}/${faculties}`} detail="Institution map" tone="slate" />
        <MetricTile code="CRT" label="Active criteria" value={activeCriteria} detail={`${auditEvents} audit events`} tone="blue" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="pro-card overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Recent User Accounts</h2>
              <p className="mt-1 text-sm text-gray-600">Latest staff accounts and access readiness indicators.</p>
            </div>
            <Link href="/system-admin/users" className="rounded-lg border border-teal-200 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50">
              User Management
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3">Access</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="align-top hover:bg-gray-50/80">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-950">{user.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${roleTone(user.role)}`}>{label(user.role)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{user.departmentRef?.name || user.department || 'Unassigned'}</p>
                      <p className="mt-1 text-xs text-gray-500">{user.faculty?.name || 'No faculty'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`font-semibold ${user.isActive ? 'text-teal-800' : 'text-rose-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</p>
                      <p className="mt-1 text-xs text-gray-500">{user.emailVerified ? 'Email verified' : 'Email pending'} / {user.onboarded ? 'Onboarded' : 'Needs onboarding'}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <section className="pro-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Roles Summary</h2>
                <p className="mt-1 text-sm text-gray-600">Distribution of access across system portals.</p>
              </div>
              <span className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-teal-800">RBAC</span>
            </div>
            <div className="mt-5 space-y-3">
              {roleRows.map((row) => <ProgressRow key={row.role} label={label(row.role)} value={row.value} total={totalUsers} />)}
            </div>
          </section>

          <section className="pro-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Administration Shortcuts</h2>
                <p className="mt-1 text-sm text-gray-600">Core configuration modules.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Shortcut href="/system-admin/users" label="User management" detail="Roles, account status, onboarding" />
              <Shortcut href="/system-admin/criteria" label="Promotion criteria" detail="Eligibility rules and scoring" />
              <Shortcut href="/system-admin/structure" label="Faculties and departments" detail="Institutional structure mapping" />
              <Shortcut href="/system-admin/settings" label="System settings" detail="Platform configuration values" />
              <Shortcut href="/analytics" label="Reports and analytics" detail="Promotion trends and exports" />
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <section className="pro-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Faculties and Departments</h2>
              <p className="mt-1 text-sm text-gray-600">Institution structure currently configured.</p>
            </div>
            <Link href="/system-admin/structure" className="text-sm font-semibold text-teal-800 hover:text-teal-900">Manage</Link>
          </div>
          <div className="mt-4 space-y-3">
            {structureRows.length === 0 ? (
              <EmptyPanel title="No structure configured" description="Add faculties and departments to scope HOD/Dean access." compact />
            ) : (
              structureRows.map((faculty) => (
                <div key={faculty.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-950">{faculty.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{faculty._count.departments} department(s) / {faculty._count.users} user(s)</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="pro-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Promotion Criteria</h2>
              <p className="mt-1 text-sm text-gray-600">Recently updated active eligibility rules.</p>
            </div>
            <Link href="/system-admin/criteria" className="text-sm font-semibold text-teal-800 hover:text-teal-900">Manage</Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentCriteria.length === 0 ? (
              <EmptyPanel title="No active criteria" description="Create promotion criteria before eligibility can be calculated." compact />
            ) : (
              recentCriteria.map((criteria) => (
                <div key={criteria.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-950">{label(criteria.currentRank)} to {label(criteria.targetRank)}</p>
                      <p className="mt-1 text-xs text-gray-500">Minimum score {criteria.minimumTotalScore ?? 'N/A'} / {criteria.minimumYearsInCurrentRank} year(s)</p>
                    </div>
                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-900">{criteriaCode(criteria.currentRank, criteria.targetRank)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="pro-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">System Audit Activity</h2>
              <p className="mt-1 text-sm text-gray-600">Latest tracked governance events.</p>
            </div>
            <Link href="/audit" className="text-sm font-semibold text-teal-800 hover:text-teal-900">Open</Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentAudit.length === 0 ? (
              <EmptyPanel title="No audit activity" description="Important actions will be recorded here automatically." compact />
            ) : (
              recentAudit.map((log) => (
                <div key={log.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-950">{label(log.action)}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{log.description || 'System event recorded.'}</p>
                  <p className="mt-2 text-xs font-medium text-gray-500">{log.actor?.name || 'System'} - {formatDate(log.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricTile({ code, label: title, value, detail, tone }: { code: string; label: string; value: number | string; detail: string; tone: 'teal' | 'amber' | 'green' | 'rose' | 'slate' | 'blue' }) {
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

function Shortcut({ href, label: title, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800">
      <span>
        <span className="block">{title}</span>
        <span className="mt-0.5 block text-xs font-normal text-gray-500">{detail}</span>
      </span>
      <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-teal-700">Open</span>
    </Link>
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
