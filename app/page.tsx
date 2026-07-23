import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../lib/auth';
import { getDashboardForRole } from '../lib/rbac';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (session?.legacy) {
    redirect('/hr/dashboard');
  }

  redirect(getDashboardForRole(session?.role));
}
