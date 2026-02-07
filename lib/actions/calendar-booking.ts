'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/** Récupère l'ID de l'artiste pour l'utilisateur Supabase connecté (null si non trouvé). */
export async function getArtistIdForCurrentUser(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email },
  });
  if (!prismaUser) return null;

  const artist = await prisma.artistProfile.findFirst({
    where: { userId: prismaUser.id },
  });
  return artist?.id ?? null;
}

export type BookingTypeInput = 'CONSULTATION' | 'SESSION' | 'RETOUCHE';
export type BookingStatusInput = 'CONFIRMED' | 'PENDING_PAYMENT' | 'CANCELLED' | 'COMPLETED';

export interface CreateCalendarBookingInput {
  title: string; // Nom du client
  clientEmail: string;
  type: BookingTypeInput;
  startTime: Date;
  endTime: Date;
  status: BookingStatusInput;
}

export interface UpdateCalendarBookingInput {
  title?: string;
  clientEmail?: string;
  type?: BookingTypeInput;
  startTime?: Date;
  endTime?: Date;
  status?: BookingStatusInput;
}

/** Crée un rendez-vous depuis le calendrier (sans Stripe). */
export async function createCalendarBooking(
  input: CreateCalendarBookingInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const artistId = await getArtistIdForCurrentUser();
    if (!artistId) return { success: false, error: 'Artiste non trouvé' };

    const { title, clientEmail, type, startTime, endTime, status } = input;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) return { success: false, error: 'La fin doit être après le début' };
    if (start < new Date()) return { success: false, error: 'La date doit être dans le futur ou aujourd\'hui' };

    const durationMin = Math.round((end.getTime() - start.getTime()) / 60_000);
    if (durationMin < 15) return { success: false, error: 'Durée minimum 15 minutes' };

    let client = await prisma.user.findUnique({
      where: { email: clientEmail.trim().toLowerCase() },
    });
    if (!client) {
      client = await prisma.user.create({
        data: {
          email: clientEmail.trim().toLowerCase(),
          name: title.trim() || 'Client',
          role: 'CLIENT',
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        artistId,
        clientId: client.id,
        startTime: start,
        endTime: end,
        durationMin,
        type,
        status,
        price: 0,
        depositAmount: 0,
        depositPaid: status === 'CONFIRMED',
      },
    });

    revalidatePath('/dashboard/calendar');
    return { success: true, id: booking.id };
  } catch (e) {
    console.error('createCalendarBooking', e);
    const msg =
      e instanceof Error ? e.message : 'Erreur lors de la création';
    return { success: false, error: String(msg).slice(0, 500) };
  }
}

/** Met à jour un rendez-vous existant. */
export async function updateCalendarBooking(
  bookingId: string,
  input: UpdateCalendarBookingInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const artistId = await getArtistIdForCurrentUser();
    if (!artistId) return { success: false, error: 'Artiste non trouvé' };

    const existing = await prisma.booking.findFirst({
      where: { id: bookingId, artistId },
      include: { client: true },
    });
    if (!existing) return { success: false, error: 'Rendez-vous introuvable' };

    const updates: Parameters<typeof prisma.booking.update>[0]['data'] = {};
    if (input.clientEmail != null) {
      const email = input.clientEmail.trim().toLowerCase();
      let client = await prisma.user.findUnique({ where: { email } });
      if (!client) {
        client = await prisma.user.create({
          data: { email, name: input.title?.trim() ?? existing.client.name, role: 'CLIENT' },
        });
      }
      updates.clientId = client.id;
    }
    if (input.title != null) {
      const targetClientId = (updates.clientId as string) ?? existing.clientId;
      await prisma.user.update({
        where: { id: targetClientId },
        data: { name: input.title.trim() },
      });
    }
    if (input.type != null) updates.type = input.type;
    if (input.status != null) {
      updates.status = input.status;
      updates.depositPaid = input.status === 'CONFIRMED';
    }
    if (input.startTime != null) updates.startTime = new Date(input.startTime);
    if (input.endTime != null) updates.endTime = new Date(input.endTime);
    if (input.startTime != null && input.endTime != null) {
      const start = new Date(input.startTime);
      const end = new Date(input.endTime);
      updates.durationMin = Math.round((end.getTime() - start.getTime()) / 60_000);
    } else if (input.startTime != null || input.endTime != null) {
      const start = input.startTime ? new Date(input.startTime) : existing.startTime;
      const end = input.endTime ? new Date(input.endTime) : existing.endTime;
      updates.durationMin = Math.round((end.getTime() - start.getTime()) / 60_000);
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: updates,
    });

    revalidatePath('/dashboard/calendar');
    return { success: true };
  } catch (e) {
    console.error('updateCalendarBooking', e);
    const msg =
      e instanceof Error ? e.message : 'Erreur lors de la mise à jour';
    return { success: false, error: String(msg).slice(0, 500) };
  }
}

/** Supprime un rendez-vous. */
export async function deleteCalendarBooking(
  bookingId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const artistId = await getArtistIdForCurrentUser();
    if (!artistId) return { success: false, error: 'Artiste non trouvé' };

    const existing = await prisma.booking.findFirst({
      where: { id: bookingId, artistId },
    });
    if (!existing) return { success: false, error: 'Rendez-vous introuvable' };

    await prisma.booking.delete({ where: { id: bookingId } });
    revalidatePath('/dashboard/calendar');
    return { success: true };
  } catch (e) {
    console.error('deleteCalendarBooking', e);
    const msg =
      e instanceof Error ? e.message : 'Erreur lors de la suppression';
    return { success: false, error: String(msg).slice(0, 500) };
  }
}
