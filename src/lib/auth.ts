import { session, isPrismaAvailable, prisma } from './prisma';
import type { UserModel } from '@/generated/prisma/models/User';
import { cookies } from 'next/headers';

export async function getCurrentUser(request?: Request): Promise<UserModel | null> {
  let sessionToken: string | null = null;

  if (request) {
    // Extract session-id cookie from request headers (for API routes)
    const header = request.headers.get('cookie') || '';
    const match = header.match(/session-id=([^;]+)/);
    sessionToken = match ? match[1] : null;
  } else {
    // For server components, use cookies from next/headers
    const cookieStore = await cookies();
    sessionToken = cookieStore.get('session-id')?.value ?? null;
  }

  if (!sessionToken) {
    return null;
  }

  // Validate session using our session helper (works in both runtimes)
  const sessionData = await session.validate(sessionToken);

  if (!sessionData) {
    return null;
  }

  // If we have access to Prisma client (Node.js runtime), fetch full user from database
  if (isPrismaAvailable && prisma) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionData.userId },
        // Select all fields we need - this should match UserModel
        select: {
          id: true,
          email: true,
          name: true,
          age: true,
          gender: true,
          address: true,
          role: true,
          collegeId: true,
          createdAt: true,
          updatedAt: true,
          applications: true,
          vacanciesDrafted: true,
          vacanciesHrReviewed: true,
          vacanciesVpaaEndorsed: true,
          auditLogs: true,
          sessions: true,
        },
      });

      if (user) {
        return user as UserModel;
      }
      // If user not found in DB, fall back to session data
    } catch (error) {
      console.error('Error fetching user from database:', error);
      // Fall back to session data approach
    }
  }

  // Fallback: Return user data from JWT payload/session (Edge Runtime or when DB fetch fails)
  // We don't have the full user object in Edge Runtime JWT approach
  // For now, we'll return what we have from the JWT payload/session
  return {
    id: sessionData.userId,
    email: sessionData.email,
    role: sessionData.role as UserRole,
    name: '', // Not available in session - would need DB lookup
    emailVerified: undefined, // Not available in session
    image: '', // Placeholder
    passwordHash: '', // We don't have password hash in JWT/session
    collegeId: null, // Not available in session - would need DB lookup
    createdAt: new Date(sessionData.iat * 1000),
    updatedAt: new Date(), // We don't have updatedAt in JWT/session
    age: undefined, // Not available in session
    gender: undefined, // Not available in session
    address: undefined, // Not available in session
    applications: [],
    vacanciesDrafted: [],
    vacanciesHrReviewed: [],
    vacanciesVpaaEndorsed: [],
    auditLogs: [],
    sessions: [],
  } as UserModel;
}