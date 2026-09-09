import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if table exists by attempting to select 1 from it limit 1
    try {
      await prisma.session.findFirst({ take: 1 });
      return NextResponse.json({ message: 'Session table already exists' });
    } catch (e) {
      // Table doesn't exist, create it
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
      return NextResponse.json({ message: 'Session table created' });
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}