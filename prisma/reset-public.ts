/**
 * Reset du schéma public uniquement (évite "must be owner of table identities" sur auth).
 * Utilise DIRECT_URL pour exécuter le SQL, puis indique de lancer db push.
 */
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Reset du schéma public uniquement...');
  // Une seule requête (Prisma n'accepte qu'une instruction à la fois sinon)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    END $$;
  `);
  console.log('✅ Schéma public vidé. Lance maintenant : npx prisma db push');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
