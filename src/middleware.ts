import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { session, isPrismaAvailable } from '@/lib/prisma';

// This middleware runs in Node.js runtime to allow Prisma client usage for session validation
export const runtime = 'nodejs';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const authPaths = [
    '/hr',
    '/career-path',
    '/vacancies',
    '/crrc-evaluations',
    '/reports',
    '/admin',
    '/applicant',
  ];

  // Check if the path requires authentication
  const requiresAuth = authPaths.some((path) => pathname.startsWith(path));

  if (requiresAuth) {
    const sessionToken = request.cookies.get('session-id')?.value;
    console.log(`[middleware] Session token: ${sessionToken}`);

    // If no session cookie, redirect to login
    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      console.log('[middleware] No session token, redirecting to /');
      return NextResponse.redirect(url);
    }

    // Validate session using our session helper (works in both runtimes)
    const sessionData = await session.validate(sessionToken);
    console.log(`[middleware] Session data: ${sessionData ? JSON.stringify(sessionData) : 'null'}`);

    // If session not found or expired, redirect to login
    if (!sessionData) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      console.log('[middleware] Invalid session, redirecting to /');
      return NextResponse.redirect(url);
    }

    // Role-based access control
    const role = sessionData.role;
    const allowedRoles: Record<string, string[]> = {
      '/hr': ['hr'],
      '/admin': ['admin'],
      '/career-path': ['hr', 'applicant'],
      '/vacancies': ['hr', 'admin'],
      '/crrc-evaluations': ['hr'],
      '/reports': ['hr', 'admin'],
      '/applicant': ['applicant'],
    };

    // Find the most specific matching path prefix
    let matchedPrefix = '';
    for (const prefix of Object.keys(allowedRoles)) {
      if (pathname.startsWith(prefix) && prefix.length > matchedPrefix.length) {
        matchedPrefix = prefix;
      }
    }

    if (matchedPrefix) {
      const allowed = allowedRoles[matchedPrefix];
      if (!allowed.includes(role)) {
        // Redirect to home or show 403; for simplicity redirect to login
        const url = request.nextUrl.clone();
        url.pathname = '/';
        console.log(`[middleware] Role ${role} not allowed for ${matchedPrefix}, redirecting to /`);
        return NextResponse.redirect(url);
      }
    }
  }

  // Continue to the requested page
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};