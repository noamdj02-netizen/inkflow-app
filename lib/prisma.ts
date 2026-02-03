/**
 * Instance Prisma Client (singleton pattern pour éviter les connexions multiples)
 * 
 * ⚠️ SERVER-SIDE ONLY - Ne pas importer dans des composants React ou hooks côté client
 * Ce fichier utilise PrismaClient qui ne peut pas être bundlé par Vite.
 * Utiliser uniquement dans les API routes Vercel Serverless Functions.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
