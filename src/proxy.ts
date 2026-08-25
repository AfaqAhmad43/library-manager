import { NextRequest, NextResponse } from 'next/server';

// Cookie name must match the one set in src/lib/auth.ts
const SESSION_COOKIE = 'sb-session';

// All routes that do NOT require authentication
const PUBLIC_PATHS = ['/login'];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through Next.js internals and static files immediately
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // Fast optimistic check: look for the session cookie
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = Boolean(token);

  // Unauthenticated user trying to access a protected route → redirect to /login
  if (!isPublicPath && !isAuthenticated) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('next', pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access /login → redirect to home
  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  return NextResponse.next();
}

// Run on all routes except Next.js internals, static files, and API routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
