import { prisma } from './src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('Users:', users);
}

main().catch(console.error);