/**
 * Seed InkFlow — utilisateur artiste, client, services et rendez-vous de test.
 * À lancer après un reset : npx prisma db seed
 *
 * Pour que le calendrier affiche les RDV : connecte-toi avec l'email artiste (voir ci-dessous)
 * dans Supabase Auth, ou crée un compte avec artist@test.com.
 */
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARTIST_EMAIL = 'artist@test.com';
const CLIENT_EMAIL = 'client@test.com';

async function main() {
  console.log('🌱 Seed InkFlow...');

  // ——— 1. Utilisateur ARTISTE ———
  const artistUser = await prisma.user.upsert({
    where: { email: ARTIST_EMAIL },
    update: {},
    create: {
      email: ARTIST_EMAIL,
      name: 'Léa Tattoo',
      phone: '+33612345678',
      role: 'ARTIST',
    },
  });
  console.log('  ✓ User artiste:', artistUser.email);

  // ——— 2. Profil artiste (slug pour /artist/lea-tattoo) ———
  const artist = await prisma.artistProfile.upsert({
    where: { userId: artistUser.id },
    update: {},
    create: {
      userId: artistUser.id,
      slug: 'lea-tattoo',
      description: 'Artiste tatoueur seed.',
      nomStudio: 'Studio Léa',
      depositPercentage: 30,
      slotIntervalMin: 30,
      minNoticeHours: 24,
      defaultPrepTimeMin: 15,
      defaultCleanupTimeMin: 15,
    },
  });
  console.log('  ✓ ArtistProfile:', artist.slug);

  // ——— 3. Heures de travail (Lundi–Vendredi 9h–19h) ———
  const days = [1, 2, 3, 4, 5]; // Lundi à Vendredi
  for (const dayOfWeek of days) {
    await prisma.workingHour.upsert({
      where: {
        artistId_dayOfWeek: { artistId: artist.id, dayOfWeek },
      },
      update: {},
      create: {
        artistId: artist.id,
        dayOfWeek,
        startTime: '09:00',
        endTime: '19:00',
        isActive: true,
      },
    });
  }
  console.log('  ✓ WorkingHours (Lun–Ven 9h–19h)');

  // ——— 4. Services (flashs / consultations) ———
  const service1 = await prisma.service.upsert({
    where: { id: 'seed-service-1' },
    update: {},
    create: {
      id: 'seed-service-1',
      artistId: artist.id,
      name: 'Flash S',
      durationMin: 60,
      price: 80,
      depositAmount: 30,
      statut: 'available',
    },
  });
  const service2 = await prisma.service.upsert({
    where: { id: 'seed-service-2' },
    update: {},
    create: {
      id: 'seed-service-2',
      artistId: artist.id,
      name: 'Consultation',
      durationMin: 30,
      price: 0,
      depositAmount: 0,
      statut: 'available',
    },
  });
  console.log('  ✓ Services:', service1.name, ',', service2.name);

  // ——— 5. Utilisateur CLIENT ———
  const clientUser = await prisma.user.upsert({
    where: { email: CLIENT_EMAIL },
    update: {},
    create: {
      email: CLIENT_EMAIL,
      name: 'Marie Client',
      phone: '+33698765432',
      role: 'CLIENT',
    },
  });
  console.log('  ✓ User client:', clientUser.email);

  // ——— 6. Rendez-vous bidons (cette semaine + prochaine) ———
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const slots = [
    { dayOffset: 1, hour: 10, durationMin: 60, status: 'CONFIRMED' as const },
    { dayOffset: 1, hour: 14, durationMin: 30, status: 'CONFIRMED' as const },
    { dayOffset: 3, hour: 11, durationMin: 60, status: 'PENDING_PAYMENT' as const },
    { dayOffset: 5, hour: 9, durationMin: 60, status: 'CONFIRMED' as const },
    { dayOffset: 8, hour: 15, durationMin: 30, status: 'CONFIRMED' as const },
  ];

  // Supprimer les anciens bookings de test (même artiste) pour réensemencer proprement
  await prisma.booking.deleteMany({
    where: { artistId: artist.id, clientId: clientUser.id },
  });

  for (const slot of slots) {
    const start = new Date(today);
    start.setDate(start.getDate() + slot.dayOffset);
    start.setHours(slot.hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + slot.durationMin);

    await prisma.booking.create({
      data: {
        clientId: clientUser.id,
        artistId: artist.id,
        serviceId: slot.durationMin >= 60 ? service1.id : service2.id,
        startTime: start,
        endTime: end,
        type: 'SESSION',
        durationMin: slot.durationMin,
        status: slot.status,
        price: slot.durationMin >= 60 ? 80 : 0,
        depositAmount: slot.durationMin >= 60 ? 30 : 0,
        depositPaid: slot.status === 'CONFIRMED',
      },
    });
  }
  console.log('  ✓ 5 rendez-vous de test créés');

  console.log('\n✅ Seed terminé.');
  console.log('   Pour voir le calendrier : connecte-toi avec', ARTIST_EMAIL, '(créer le compte dans Supabase Auth si besoin).');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
