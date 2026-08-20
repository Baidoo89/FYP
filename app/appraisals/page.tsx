import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, verifySessionToken, type AuthRole } from '../../lib/auth';
import { getDashboardForRole } from '../../lib/rbac';

function getModernWorkspaceForRole(role?: AuthRole | null) {
  if (role === 'STAFF' || role === 'LECTURER') return '/lecturer-portal/eligibility';
  if (role === 'HOD_DEAN') return '/hod/review-queue';
  if (role === 'HR_ADMIN') return '/analytics';
  if (role === 'COMMITTEE_REVIEWER') return '/committee/dashboard';
  if (role === 'SYSTEM_ADMIN') return '/analytics';
  return getDashboardForRole(role);
}

export default async function AppraisalsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (session?.legacy) {
    redirect('/analytics');
  }

  redirect(getModernWorkspaceForRole(session?.role));
}
