import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, verifySessionToken, type AuthRole } from '../../lib/auth';
import { getDashboardForRole } from '../../lib/rbac';

function getPromotionWorkspaceForRole(role?: AuthRole | null) {
  if (role === 'LECTURER') return '/lecturer-portal/application';
  if (role === 'HOD_DEAN') return '/hod/review-queue';
  if (role === 'HR_ADMIN') return '/hr/requests?segment=all';
  if (role === 'COMMITTEE_REVIEWER') return '/committee/review?segment=pending';
  if (role === 'SYSTEM_ADMIN') return '/hr/requests?segment=all';
  return getDashboardForRole(role);
}

export default async function PromotionsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (session?.legacy) {
    redirect('/hr/requests?segment=all');
  }

  redirect(getPromotionWorkspaceForRole(session?.role));
}
