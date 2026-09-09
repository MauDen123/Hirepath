import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session-id')?.value;

  // Delete session from database if exists
  if (sessionId) {
    try {
      await prisma.session.deleteMany({
        where: { id: sessionId },
      });
    } catch (err) {
      // Handle missing table - nothing to delete if table doesn't exist
      if (!(err instanceof Error && err.message &&
            (err.message.includes('does not exist') ||
             err.message.includes('UndefinedTable') ||
             err.message.includes('relation does not exist')))) {
        throw err;
      }
    }
  }

  // Clear the session cookie
  cookieStore.delete('session-id');

  // Redirect to login page
  return NextResponse.redirect(new URL('/', request.url));
}