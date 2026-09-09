import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal whether the email exists for security
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = `${user.id}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Set cookie (httpOnly for security)
    const cookieStore = await cookies();
    cookieStore.set('session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Store session in database, create table if missing
    try {
      await prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        },
      });
    } catch (err) {
      // Handle missing table by creating it
      if (err instanceof Error && err.message &&
          (err.message.includes('does not exist') ||
           err.message.includes('UndefinedTable') ||
           err.message.includes('relation does not exist'))) {
        // Table missing, create it
        await prisma.$executeRaw`
          CREATE TABLE "Session" (
            "id" TEXT PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "expiresAt" TIMESTAMP(3) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;
        await prisma.$executeRaw`
          CREATE INDEX "Session_userId_idx" ON "Session"("userId");
        `;
        // Retry creating session
        await prisma.session.create({
          data: {
            id: sessionId,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        throw err;
      }
    }

    // Return success (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
