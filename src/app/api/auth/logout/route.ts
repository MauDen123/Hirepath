import { NextResponse } from 'next/server';
import { session } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session-id')?.value;

  // Delete session using our session helper if exists
  if (sessionToken) {
    try {
      await session.delete(sessionToken);
    } catch (err) {
      // Handle errors - in Edge Runtime with JWT, this might fail if token is invalid
      // but we still want to clear the cookie
      console.warn('Session delete error:', err);
    }
  }

  // Clear the session cookie
  cookieStore.delete('session-id');

  // Redirect to login page
  return NextResponse.redirect(new URL('/', request.url));
}