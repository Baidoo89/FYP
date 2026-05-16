import { NextRequest, NextResponse } from 'next/server';
import { getEdgeAuthSession } from './lib/auth-edge';

const publicRoutes = ['/login', '/register', '/onboarding'];
const publicApiRoutes = ['/api/auth/login', '/api/auth/register'];

// Admin setup is a public route for initial account creation
const adminSetupRoute = '/admin/setup';
const adminSetupApiRoute = '/api/admin/setup';

function isPublicRoute(pathname: string) {
  return pathname === adminSetupRoute || 
    publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isPublicApiRoute(pathname: string) {
  return pathname === adminSetupApiRoute || 
    publicApiRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml')
  ) {
    return NextResponse.next();
  }

  const session = await getEdgeAuthSession(request);
  const authenticated = Boolean(session);
  const role = session?.role;
  const onboarded = session?.onboarded;
  const dashboardPath = role === 'HR_ADMIN' ? '/hr/dashboard' : '/lecturer-portal';

  // Allow public routes if not authenticated
  if (isPublicRoute(pathname)) {
    // If authenticated and trying to access login/register, redirect based on onboarding status
    if (authenticated && (pathname === '/login' || pathname === '/register')) {
      if (role === 'HR_ADMIN') {
        return NextResponse.redirect(new URL('/hr/dashboard', request.url));
      }

      if (!onboarded) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // If not onboarded and trying to access /onboarding, allow it
    if (pathname === '/onboarding' && authenticated && role === 'HR_ADMIN') {
      return NextResponse.redirect(new URL('/hr/dashboard', request.url));
    }

    if (pathname === '/onboarding' && authenticated && !onboarded) {
      return NextResponse.next();
    }

    // If onboarded and trying to access /onboarding, redirect to dashboard
    if (pathname === '/onboarding' && authenticated && onboarded) {
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    // Allow onboarding API without full onboarding check
    if (pathname === '/api/auth/onboarding') {
      if (!authenticated) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.next();
    }

    if (pathname.startsWith('/api/uploads') || pathname.startsWith('/api/promotion-requests')) {
      if (!authenticated) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      if (pathname.startsWith('/api/promotion-requests') && pathname.includes('/verify') && role !== 'HR_ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      if (pathname.startsWith('/api/uploads') && !['LECTURER', 'HR_ADMIN'].includes(role || '')) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.next();
    }

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated but not onboarded, redirect to onboarding
  if (role !== 'HR_ADMIN' && !onboarded && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (pathname === '/dashboard' && role !== 'HR_ADMIN') {
    return NextResponse.redirect(new URL('/lecturer-portal', request.url));
  }

  if (session?.legacy && pathname.startsWith('/lecturer-portal')) {
    return NextResponse.redirect(new URL('/hr/dashboard', request.url));
  }

  if (session?.legacy && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/hr/dashboard', request.url));
  }

  if (pathname.startsWith('/hr') && role !== 'HR_ADMIN') {
    return NextResponse.redirect(new URL('/lecturer-portal', request.url));
  }

  if (pathname.startsWith('/lecturer-portal') && role === 'HR_ADMIN') {
    return NextResponse.redirect(new URL('/hr/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

