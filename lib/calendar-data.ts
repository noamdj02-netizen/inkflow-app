/**
 * Données calendrier côté serveur : récupère les réservations Prisma
 * pour l'artiste connecté (via Supabase auth → User email → ArtistProfile).
 * SERVER-ONLY : utilise Prisma et createClient(Supabase) server.
 */

import { startOfMonth, subMonths, endOfMonth, addMonths } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export interface CalendarBookingPayload {
  id: string;
  startTime: string; // ISO
  endTime: string;
  clientName: string;
  clientEmail: string;
  status: string;
  type: string;
  artistName: string | null;
}

/**
 * Récupère les réservations (Prisma Booking) pour l'artiste lié à l'utilisateur Supabase.
 * Retourne un tableau sérialisable (dates en ISO) pour la plage : mois courant ± 1 mois.
 */
export async function getCalendarBookingsForCurrentUser(): Promise<CalendarBookingPayload[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return [];

  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email },
  });
  if (!prismaUser) return [];

  const artist = await prisma.artistProfile.findFirst({
    where: { userId: prismaUser.id },
  });
  if (!artist) return [];

  const rangeStart = startOfMonth(subMonths(new Date(), 1));
  const rangeEnd = endOfMonth(addMonths(new Date(), 2));

  const bookings = await prisma.booking.findMany({
    where: {
      artistId: artist.id,
      startTime: { gte: rangeStart, lte: rangeEnd },
    },
    include: {
      client: { select: { name: true, email: true } },
      artist: { select: { nomStudio: true, user: { select: { name: true } } } },
    },
    orderBy: { startTime: 'asc' },
  });

  return bookings.map((b) => ({
    id: b.id,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    clientName: b.client.name,
    clientEmail: b.client.email,
    status: b.status,
    type: b.type,
    artistName: b.artist.nomStudio ?? b.artist.user?.name ?? null,
  }));
}
