import { prisma } from './prisma';
import type { UserModel } from '@/generated/prisma/models/User';
import { cookies } from 'next/headers';

export async function getCurrentUser(request?: Request): Promise<UserModel | null> {
  let sessionId: string | null = null;

  if (request) {
    // Extract session-id cookie from request headers (for API routes)
    const header = request.headers.get('cookie') || '';
    const match = header.match(/session-id=([^;]+)/);
    sessionId = match ? match[1] : null;
  } else {
    // For server components, use cookies from next/headers
    const cookieStore = await cookies();
    sessionId = cookieStore.get('session-id')?.value ?? null;
  }

  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}