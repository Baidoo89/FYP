import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Building2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { prisma } from '../../../lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

function label(value?: string | null) {
  if (!value) return 'Not assigned';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: Date | string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function initialsFor(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default async function HodProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session || session.legacy) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      role: true,
      staffId: true,
      department: true,
      currentRank: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
      departmentRef: { select: { name: true } },
      faculty: { select: { name: true } },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const initials = initialsFor(user.name) || 'HD';
  const department = user.departmentRef?.name || user.department || 'Not assigned';
  const faculty = user.faculty?.name || 'Not assigned';

  return (
    <main className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <section className="relative overflow-hidden rounded-xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-primary text-lg font-black text-white shadow-sm sm:h-20 sm:w-20 sm:text-2xl">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="pro-eyebrow">HOD / Dean Profile</div>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{user.name}</h1>
              <p className="mt-1 break-words text-sm text-gray-600">Official department review account for the Digital Staff Promotion Support System.</p>
            </div>
          </div>
          <Link href="/hod/review-queue" className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark sm:w-auto">
            Open Review Queue
          </Link>
        </div>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="pro-card min-w-0 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primarySoft text-brand-primary">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-950">Account Information</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">Identity and role details used for department-scoped promotion reviews.</p>
            </div>
          </div>

          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            <ProfileFact label="Full Name" value={user.name} />
            <ProfileFact label="Email" value={user.email} icon={Mail} />
            <ProfileFact label="Staff ID" value={user.staffId || 'Not assigned'} />
            <ProfileFact label="Role" value={label(user.role)} />
            <ProfileFact label="Current Rank" value={label(user.currentRank)} />
            <ProfileFact label="Account Created" value={formatDate(user.createdAt)} />
          </div>
        </div>

        <aside className="space-y-5">
          <section className="pro-card min-w-0 p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primarySoft text-brand-primary">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-950">Review Scope</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">Applications are filtered using your assigned department or faculty.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <ProfileFact label="Department" value={department} />
              <ProfileFact label="Faculty" value={faculty} />
            </div>
          </section>

          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-white/70">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold">Secure Review Access</p>
                <p className="mt-1 text-sm leading-6 opacity-80">
                  Email verification is {user.emailVerified ? 'complete' : 'pending'}, and this account is {user.isActive ? 'active' : 'inactive'}.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function ProfileFact({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Mail }) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-2 flex min-w-0 items-center gap-2 break-words text-sm font-semibold text-gray-950">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />}
        <span className="min-w-0 break-words">{value}</span>
      </p>
    </div>
  );
}