import { PrismaClient } from '@prisma/client';

// Auto-sanitize DATABASE_URL for Prisma and Neon compatibility
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL;
  // Strip channel_binding=require as Prisma SCRAM channel binding fails on serverless runtimes
  url = url.replace(/[?&]channel_binding=require/g, '');
  url = url.replace(/&&/g, '&').replace(/\?&/, '?').replace(/\?$/, '');
  process.env.DATABASE_URL = url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
