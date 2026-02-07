/**
 * Instance Prisma Client - Global Singleton pour éviter "Too many connections" / Client Exhaustion
 *
 * Next.js Hot Reload recrée les modules à chaque save. Sans singleton, chaque reload
 * crée une nouvelle connexion Prisma → exhaustion rapide en dev.
 *
 * ⚠️ SERVER-SIDE ONLY - Ne pas importer dans des composants React ou hooks côté client.
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn'] // 'query' désactivé pour éviter la latence en dev
        : ['error'],
  });

// Stocker dans globalThis pour réutiliser l'instance (dev: hot reload, prod: warm instances)
globalThis.__prisma = prisma;
