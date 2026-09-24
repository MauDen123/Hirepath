import jwt from 'jsonwebtoken';

// Set runtime to Node.js for Prisma client
export const runtime = 'nodejs';

// Check if we're in Edge Runtime where Prisma client won't work
const isEdgeRuntime = typeof globalThis.EdgeRuntime !== 'undefined';

// JWT secret for session handling in Edge Runtime
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Session interface
interface SessionData {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Prisma client singleton (only available in Node.js runtime)
// We conditionally require the Prisma client to avoid loading Node.js modules in Edge Runtime
let prisma: any = null;

// Only initialize Prisma client in Node.js runtime
if (!isEdgeRuntime) {
  // Use dynamic require to avoid webpack trying to bundle Node.js modules
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PrismaClient = require('../generated/prisma/client').PrismaClient;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PrismaPg = require('@prisma/adapter-pg').PrismaPg;

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  prisma = new PrismaClient({ adapter });

  // Log that Prisma client has been initialized
  console.log('Prisma client initialized in lib/prisma.ts');

  // In development, keep a single instance to prevent hot-reload issues
  if (process.env.NODE_ENV !== 'production') {
    const globalForPrisma = global as unknown as { prisma: any };
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = prisma;
    } else {
      prisma = globalForPrisma.prisma;
    }
  }
} else {
  console.log('Prisma client NOT initialized (Edge Runtime)');
}

// Session helpers
export const session = {
  // Create a session (works in both runtimes)
  async create(userData: { id: string; email: string; role: string }) {
    if (isEdgeRuntime) {
      // Edge Runtime: use JWT
      const payload = {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      };
      return jwt.sign(payload, JWT_SECRET);
    } else {
      // Node.js runtime: use database
      if (!prisma) throw new Error('Prisma client not initialized');
      const sessionId = `${userData.id}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      await prisma.session.create({
        data: {
          id: sessionId,
          userId: userData.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        },
      });
      return sessionId;
    }
  },

  // Validate a session (works in both runtimes)
  async validate(sessionToken: string) {
    if (isEdgeRuntime) {
      // Edge Runtime: verify JWT
      try {
        const payload = jwt.verify(sessionToken, JWT_SECRET) as SessionData;
        // Check if token is expired
        if (payload.exp * 1000 < Date.now()) {
          return null;
        }
        return {
          id: payload.userId, // Using userId as session ID for consistency
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          iat: payload.iat,
          exp: payload.exp,
          expiresAt: new Date(payload.exp * 1000),
        };
      } catch (err) {
        return null; // Invalid token
      }
    } else {
      // Node.js runtime: check database
      if (!prisma) throw new Error('Prisma client not initialized');
      try {
        const session = await prisma.session.findUnique({
          where: { id: sessionToken },
          include: { user: true },
        });

        if (!session || session.expiresAt < new Date()) {
          return null;
        }

        // For Node.js runtime, we don't have iat/exp in the session object
        // We'll calculate approximate values based on createdAt/expiresAt
        const exp = Math.floor(session.expiresAt.getTime() / 1000);
        const iat = Math.floor(session.createdAt.getTime() / 1000);

        return {
          id: session.id,
          userId: session.userId,
          email: session.user.email,
          role: session.user.role,
          iat: iat,
          exp: exp,
          expiresAt: session.expiresAt,
        };
      } catch (err) {
        return null;
      }
    }
  },

  // Delete a session (works in both runtimes)
  async delete(sessionToken: string) {
    if (isEdgeRuntime) {
      // Edge Runtime: JWT tokens are stateless, nothing to delete
      // In a production app, you might maintain a blocklist
      return true;
    } else {
      // Node.js runtime: delete from database
      if (!prisma) throw new Error('Prisma client not initialized');
      try {
        await prisma.session.delete({
          where: { id: sessionToken },
        });
        return true;
      } catch (err) {
        return false;
      }
    }
  }
};

// Export Prisma client (will be null in Edge Runtime)
export { prisma };

// Export helper to check if we're in Edge Runtime
export const isEdge = isEdgeRuntime;

// Export helper to check if Prisma is available
export const isPrismaAvailable = !isEdgeRuntime && prisma !== null;
