import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'lpads_session';
const SESSION_COOKIE_VALUE = 'admin-authenticated';

const publicRoutes = ['/login'];
const publicApiRoutes = ['/api/auth/login'];

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml')
  ) {
    return NextResponse.next();
  }

  const authenticated = request.cookies.get(SESSION_COOKIE_NAME)?.value === SESSION_COOKIE_VALUE;

  if (isPublicRoute(pathname)) {
    if (authenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    if (isPublicApiRoute(pathname)) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
