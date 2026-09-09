const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./src/generated/prisma/client');
require('dotenv').config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    await prisma.session.findFirst({ take: 1 });
    console.log('Session table already exists');
  } catch (e) {
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
    console.log('Session table created');
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});