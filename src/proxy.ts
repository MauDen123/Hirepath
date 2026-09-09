import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
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
    const sessionId = request.cookies.get('session-id')?.value;

    // If no session cookie, redirect to login
    if (!sessionId) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Validate session against database
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    // If session not found or expired, redirect to login
    if (!session || session.expiresAt < new Date()) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Role-based access control
    const role = session.user.role;
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