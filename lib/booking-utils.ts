/**
 * Utilitaires pour la gestion des réservations
 * Fonctions de vérification de disponibilité, calcul de créneaux, etc.
 * 
 * ⚠️ SERVER-SIDE ONLY - Ne pas importer dans des composants React ou hooks côté client
 * Ce fichier utilise PrismaClient qui ne peut pas être bundlé par Vite.
 * Utiliser uniquement dans les API routes Vercel Serverless Functions.
 */

import { PrismaClient, BookingStatus, BookingType } from '@prisma/client';

const prisma = new PrismaClient();

export type RecurringPattern = {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Tous les X jours/semaines/mois
  endDate?: string; // ISO date string
  occurrences?: number; // Nombre max d'occurrences
};

/**
 * Vérifie si un créneau chevauche une réservation existante ou une absence
 * Prend en compte les temps de préparation et nettoyage
 */
export async function checkSlotAvailability(
  artistId: string,
  startTime: Date,
  endTime: Date,
  prepTimeMin: number = 15,
  cleanupTimeMin: number = 15,
  bufferTimeMin: number = 0
): Promise<{ available: boolean; reason?: string }> {
  // Récupérer les paramètres de l'artiste pour les temps par défaut
  const artist = await prisma.artistProfile.findUnique({
    where: { id: artistId },
    select: { defaultPrepTimeMin: true, defaultCleanupTimeMin: true, bufferTimeMin: true },
  });

  const prepTime = prepTimeMin || artist?.defaultPrepTimeMin || 15;
  const cleanupTime = cleanupTimeMin || artist?.defaultCleanupTimeMin || 15;
  const bufferTime = bufferTimeMin || artist?.bufferTimeMin || 0;

  // Calculer les heures réelles avec préparation et nettoyage
  const actualStart = new Date(startTime.getTime() - prepTime * 60 * 1000);
  const actualEnd = new Date(endTime.getTime() + cleanupTime * 60 * 1000 + bufferTime * 60 * 1000);

  // 1. Vérifier les bookings existants (CONFIRMED ou PENDING_PAYMENT)
  // Inclure leurs temps de préparation/nettoyage dans la vérification
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      artistId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT],
      },
      OR: [
        {
          AND: [
            { startTime: { lt: actualEnd } },
            { endTime: { gt: actualStart } },
          ],
        },
      ],
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      prepTimeMin: true,
      cleanupTimeMin: true,
    },
  });

  for (const booking of overlappingBookings) {
    const bookingPrep = booking.prepTimeMin || artist?.defaultPrepTimeMin || 15;
    const bookingCleanup = booking.cleanupTimeMin || artist?.defaultCleanupTimeMin || 15;
    const bookingBuffer = artist?.bufferTimeMin || 0;

    const bookingActualStart = new Date(booking.startTime.getTime() - bookingPrep * 60 * 1000);
    const bookingActualEnd = new Date(
      booking.endTime.getTime() + bookingCleanup * 60 * 1000 + bookingBuffer * 60 * 1000
    );

    // Vérifier le chevauchement réel
    if (bookingActualStart < actualEnd && bookingActualEnd > actualStart) {
      return {
        available: false,
        reason: `Créneau chevauchant une réservation existante (${booking.status}) - temps de préparation/nettoyage inclus`,
      };
    }
  }

  // 2. Vérifier les absences (leaves)
  const startDate = startTime.toISOString().split('T')[0]; // YYYY-MM-DD
  const endDate = endTime.toISOString().split('T')[0];

  const overlappingLeave = await prisma.leave.findFirst({
    where: {
      artistId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    select: { id: true, date: true, reason: true },
  });

  if (overlappingLeave) {
    return {
      available: false,
      reason: `Créneau dans une période d'absence (${overlappingLeave.reason || 'Congé'})`,
    };
  }

  // 3. Vérifier les horaires d'ouverture
  const dayOfWeek = startTime.getDay(); // 0 = Dimanche, 6 = Samedi
  const startTimeOnly = startTime.toTimeString().slice(0, 5); // "HH:MM"
  const endTimeOnly = endTime.toTimeString().slice(0, 5);

  const workingHour = await prisma.workingHour.findFirst({
    where: {
      artistId,
      dayOfWeek,
      isActive: true,
      startTime: { lte: startTimeOnly },
      endTime: { gte: endTimeOnly },
    },
  });

  if (!workingHour) {
    return {
      available: false,
      reason: 'Créneau hors des horaires d\'ouverture',
    };
  }

  return { available: true };
}

/**
 * Calcule les créneaux disponibles pour un artiste sur une période
 */
export async function getAvailableSlots(
  artistId: string,
  startDate: Date,
  endDate: Date,
  serviceDurationMin: number,
  slotIntervalMin: number = 30
): Promise<Array<{ startTime: Date; endTime: Date; available: boolean }>> {
  const slots: Array<{ startTime: Date; endTime: Date; available: boolean }> = [];
  const currentDate = new Date(startDate);

  // Récupérer les horaires d'ouverture de l'artiste
  const workingHours = await prisma.workingHour.findMany({
    where: {
      artistId,
      isActive: true,
    },
  });

  // Récupérer les bookings existants et les leaves pour cette période
  const existingBookings = await prisma.booking.findMany({
    where: {
      artistId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT],
      },
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const leaves = await prisma.leave.findMany({
    where: {
      artistId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
    },
  });

  const leaveDates = new Set(
    leaves.map((leave) => leave.date.toISOString().split('T')[0])
  );

  // Parcourir chaque jour de la période
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];

    // Vérifier si c'est un jour de congé
    if (leaveDates.has(dateStr)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Trouver les horaires d'ouverture pour ce jour
    const dayWorkingHours = workingHours.filter((wh) => wh.dayOfWeek === dayOfWeek);

    for (const wh of dayWorkingHours) {
      const [startHour, startMin] = wh.startTime.split(':').map(Number);
      const [endHour, endMin] = wh.endTime.split(':').map(Number);

      const dayStart = new Date(currentDate);
      dayStart.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMin, 0, 0);

      // Générer les créneaux pour cette plage horaire
      let slotStart = new Date(dayStart);

      while (slotStart.getTime() + serviceDurationMin * 60 * 1000 <= dayEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + serviceDurationMin * 60 * 1000);

        // Vérifier si ce créneau chevauche un booking existant
        const overlaps = existingBookings.some(
          (booking) =>
            booking.startTime < slotEnd && booking.endTime > slotStart
        );

        slots.push({
          startTime: new Date(slotStart),
          endTime: new Date(slotEnd),
          available: !overlaps,
        });

        // Passer au créneau suivant
        slotStart = new Date(slotStart.getTime() + slotIntervalMin * 60 * 1000);
      }
    }

    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}

/**
 * Vérifie la disponibilité avec gestion intelligente des durées selon le type
 */
export async function verifierDisponibilite(
  tatoueurId: string,
  dateDebut: Date,
  duree: number,
  type: BookingType = BookingType.SESSION,
  prepTimeMin?: number,
  cleanupTimeMin?: number
): Promise<{ available: boolean; reason?: string }> {
  // Durées par défaut selon le type
  const defaultDurations: Record<BookingType, { prep: number; cleanup: number }> = {
    [BookingType.CONSULTATION]: { prep: 5, cleanup: 5 },
    [BookingType.SESSION]: { prep: 15, cleanup: 15 },
    [BookingType.RETOUCHE]: { prep: 10, cleanup: 10 },
  };

  const defaults = defaultDurations[type];
  const prep = prepTimeMin ?? defaults.prep;
  const cleanup = cleanupTimeMin ?? defaults.cleanup;

  const dateFin = new Date(dateDebut.getTime() + duree * 60 * 1000);

  return checkSlotAvailability(tatoueurId, dateDebut, dateFin, prep, cleanup);
}

/**
 * Crée une série de réservations récurrentes
 */
export async function createRecurringBookings(
  artistId: string,
  clientId: string,
  firstStartTime: Date,
  durationMin: number,
  pattern: RecurringPattern,
  bookingData: {
    serviceId?: string;
    type: BookingType;
    price: number;
    depositAmount?: number;
    projectDescription?: string;
    zone?: string;
    size?: string;
    style?: string;
    prepTimeMin?: number;
    cleanupTimeMin?: number;
  }
): Promise<{ seriesId: string; bookingIds: string[] }> {
  // Créer la série récurrente
  const series = await prisma.recurringBookingSeries.create({
    data: {
      artistId,
      clientId,
      frequency: pattern.frequency,
      interval: pattern.interval,
      endDate: pattern.endDate ? new Date(pattern.endDate) : null,
      occurrences: pattern.occurrences ?? null,
    },
  });

  const bookings: string[] = [];
  let currentDate = new Date(firstStartTime);
  let count = 0;
  const maxOccurrences = pattern.occurrences ?? 100; // Limite par défaut

  while (count < maxOccurrences) {
    // Vérifier la date de fin si définie
    if (pattern.endDate && currentDate > new Date(pattern.endDate)) {
      break;
    }

    // Vérifier la disponibilité
    const availability = await verifierDisponibilite(
      artistId,
      currentDate,
      durationMin,
      bookingData.type,
      bookingData.prepTimeMin,
      bookingData.cleanupTimeMin
    );

    if (!availability.available) {
      // Skip ce créneau et passer au suivant
      currentDate = getNextRecurringDate(currentDate, pattern);
      continue;
    }

    // Créer la réservation
    const endTime = new Date(currentDate.getTime() + durationMin * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        artistId,
        clientId,
        serviceId: bookingData.serviceId,
        startTime: currentDate,
        endTime,
        type: bookingData.type,
        durationMin,
        status: BookingStatus.PENDING_PAYMENT,
        price: bookingData.price,
        depositAmount: bookingData.depositAmount,
        depositPaid: false,
        projectDescription: bookingData.projectDescription,
        zone: bookingData.zone,
        size: bookingData.size,
        style: bookingData.style,
        prepTimeMin: bookingData.prepTimeMin,
        cleanupTimeMin: bookingData.cleanupTimeMin,
        recurringSeriesId: series.id,
        recurringPattern: JSON.stringify(pattern),
      },
    });

    bookings.push(booking.id);
    count++;

    // Passer à la prochaine occurrence
    currentDate = getNextRecurringDate(currentDate, pattern);
  }

  return { seriesId: series.id, bookingIds: bookings };
}

/**
 * Calcule la prochaine date d'une série récurrente
 */
function getNextRecurringDate(currentDate: Date, pattern: RecurringPattern): Date {
  const next = new Date(currentDate);

  switch (pattern.frequency) {
    case 'daily':
      next.setDate(next.getDate() + pattern.interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + pattern.interval * 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + pattern.interval);
      break;
  }

  return next;
}

/**
 * Détecte automatiquement les créneaux disponibles pour une durée donnée
 */
export async function detecterCreneauxDisponibles(
  artistId: string,
  startDate: Date,
  endDate: Date,
  durationMin: number,
  type: BookingType = BookingType.SESSION,
  slotIntervalMin: number = 30
): Promise<Array<{ startTime: Date; endTime: Date; available: boolean }>> {
  const artist = await prisma.artistProfile.findUnique({
    where: { id: artistId },
    select: {
      slotIntervalMin: true,
      defaultPrepTimeMin: true,
      defaultCleanupTimeMin: true,
      bufferTimeMin: true,
    },
  });

  const interval = slotIntervalMin || artist?.slotIntervalMin || 30;
  const defaultDurations: Record<BookingType, { prep: number; cleanup: number }> = {
    [BookingType.CONSULTATION]: { prep: 5, cleanup: 5 },
    [BookingType.SESSION]: { prep: 15, cleanup: 15 },
    [BookingType.RETOUCHE]: { prep: 10, cleanup: 10 },
  };

  const defaults = defaultDurations[type];
  const prep = artist?.defaultPrepTimeMin ?? defaults.prep;
  const cleanup = artist?.defaultCleanupTimeMin ?? defaults.cleanup;
  const buffer = artist?.bufferTimeMin ?? 0;

  return getAvailableSlots(artistId, startDate, endDate, durationMin, interval);
}
