import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '../lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('lpads_session')?.value;
  const session = verifySessionToken(sessionToken);

  if (session?.legacy) {
    redirect('/hr/dashboard');
  }

  if (session?.role === 'HR_ADMIN') {
    redirect('/hr/dashboard');
  }

  if (session?.role === 'LECTURER') {
    redirect('/lecturer-portal');
  }

  redirect('/login');
}
