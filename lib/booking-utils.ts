/**
 * Utilitaires pour la gestion des réservations
 * Fonctions de vérification de disponibilité, calcul de créneaux, etc.
 */

import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Vérifie si un créneau chevauche une réservation existante ou une absence
 */
export async function checkSlotAvailability(
  artistId: string,
  startTime: Date,
  endTime: Date
): Promise<{ available: boolean; reason?: string }> {
  // 1. Vérifier les bookings existants (CONFIRMED ou PENDING_PAYMENT)
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      artistId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT],
      },
      OR: [
        // Chevauchement: le booking existant commence avant la fin ET finit après le début
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      ],
    },
    select: { id: true, startTime: true, endTime: true, status: true },
  });

  if (overlappingBooking) {
    return {
      available: false,
      reason: `Créneau chevauchant une réservation existante (${overlappingBooking.status})`,
    };
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
