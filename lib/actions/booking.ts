/**
 * Server Actions pour la gestion des réservations
 *
 * Ces fonctions sont exécutées côté serveur et peuvent être appelées depuis le client.
 * Toutes les entrées sont validées avec Zod avant tout accès BDD/Stripe.
 */

'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

/** Schéma Zod pour createBookingSession — valider avant Prisma/Stripe */
const createBookingSessionSchema = z.object({
  artistId: z.string().min(1, 'artistId requis').max(100),
  serviceId: z.string().max(100).optional(),
  clientName: z.string().min(2, 'Nom trop court').max(200).trim(),
  clientEmail: z.string().email('Email invalide').toLowerCase().trim().max(255),
  clientPhone: z.string().max(20).trim().optional().nullable(),
  startTime: z.coerce.date().refine((d) => d > new Date(), 'La date doit être dans le futur'),
  endTime: z.coerce.date(),
  durationMin: z.number().int().min(15).max(480),
  depositAmount: z.number().min(0).max(100_000),
  price: z.number().min(0).max(100_000),
  projectDescription: z.string().max(5000).trim().optional().nullable(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'endTime doit être après startTime',
  path: ['endTime'],
}).refine((data) => data.depositAmount <= data.price, {
  message: "L'acompte ne peut pas dépasser le prix total",
  path: ['depositAmount'],
});

export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  durationMin: number;
}

export interface GetAvailableSlotsParams {
  artistId: string;
  date: Date; // Date du jour (sans heure)
  durationMin: number; // Durée souhaitée en minutes
}

/**
 * Calcule les créneaux disponibles pour un artiste à une date donnée
 * 
 * Logique :
 * 1. Récupère les horaires de travail (WorkingHour) pour le jour de la semaine
 * 2. Récupère les bookings CONFIRMED existants ce jour-là
 * 3. Calcule les créneaux libres en tenant compte :
 *    - Des horaires de travail
 *    - Des bookings existants
 *    - Du temps de préparation/nettoyage
 *    - Du buffer entre les sessions
 */
export async function getAvailableSlots({
  artistId,
  date,
  durationMin,
}: GetAvailableSlotsParams): Promise<AvailableSlot[]> {
  try {
    // 1. Récupérer l'artiste avec ses paramètres
    const artist = await prisma.artistProfile.findUnique({
      where: { id: artistId },
      include: {
        workingHours: {
          where: { isActive: true },
        },
      },
    });

    if (!artist) {
      throw new Error('Artiste non trouvé');
    }

    // 2. Déterminer le jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
    const dayOfWeek = date.getDay();
    const workingHour = artist.workingHours.find((wh: { dayOfWeek: number }) => wh.dayOfWeek === dayOfWeek);

    if (!workingHour) {
      // Pas d'horaires de travail ce jour-là
      return [];
    }

    // 3. Parser les horaires de travail
    const [startHour, startMin] = workingHour.startTime.split(':').map(Number);
    const [endHour, endMin] = workingHour.endTime.split(':').map(Number);

    const workStart = new Date(date);
    workStart.setHours(startHour, startMin, 0, 0);

    const workEnd = new Date(date);
    workEnd.setHours(endHour, endMin, 0, 0);

    // 4. Récupérer les bookings CONFIRMED pour ce jour
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        artistId,
        status: 'CONFIRMED', // Seulement les bookings confirmés (avec acompte payé)
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // 5. Calculer les créneaux disponibles
    const slots: AvailableSlot[] = [];
    const slotInterval = artist.slotIntervalMin || 30; // Intervalle par défaut : 30 min
    const prepTime = artist.defaultPrepTimeMin || 15;
    const cleanupTime = artist.defaultCleanupTimeMin || 15;
    const bufferTime = artist.bufferTimeMin || 0;

    // Créer un tableau des créneaux occupés avec leurs temps de préparation/nettoyage
    const occupiedRanges: Array<{ start: Date; end: Date }> = existingBookings.map((booking: { startTime: Date | string; endTime: Date | string }) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      // Ajouter le temps de préparation avant et nettoyage après
      const actualStart = new Date(bookingStart);
      actualStart.setMinutes(actualStart.getMinutes() - prepTime);

      const actualEnd = new Date(bookingEnd);
      actualEnd.setMinutes(actualEnd.getMinutes() + cleanupTime + bufferTime);

      return {
        start: actualStart,
        end: actualEnd,
      };
    });

    // 6. Parcourir la journée par intervalles et trouver les créneaux libres
    let currentTime = new Date(workStart);

    while (currentTime < workEnd) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMin);

      // Vérifier que le créneau ne dépasse pas les horaires de travail
      if (slotEnd > workEnd) {
        break;
      }

      // Vérifier que le créneau ne chevauche pas avec un booking existant
      const overlaps = occupiedRanges.some((range) => {
        return (
          (slotStart >= range.start && slotStart < range.end) ||
          (slotEnd > range.start && slotEnd <= range.end) ||
          (slotStart <= range.start && slotEnd >= range.end)
        );
      });

      if (!overlaps) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          durationMin,
        });
      }

      // Avancer au prochain créneau possible
      currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
    }

    // 7. Filtrer les créneaux passés (si on est le jour même)
    const now = new Date();
    const availableSlots = slots.filter((slot) => slot.startTime > now);

    return availableSlots;
  } catch (error) {
    console.error('Erreur lors du calcul des créneaux disponibles:', error);
    throw error;
  }
}

/**
 * Crée une session Stripe Checkout pour le paiement de l'acompte
 * 
 * @param bookingData Données de la réservation
 * @returns URL de la session Stripe Checkout
 */
export interface CreateBookingSessionParams {
  artistId: string;
  serviceId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  startTime: Date;
  endTime: Date;
  durationMin: number;
  depositAmount: number; // En euros
  price: number; // Prix total en euros
  projectDescription?: string;
}

export async function createBookingSession(
  params: CreateBookingSessionParams
): Promise<{ bookingId: string; checkoutUrl: string }> {
  const parseResult = createBookingSessionSchema.safeParse(params);
  if (!parseResult.success) {
    const first = parseResult.error.flatten().fieldErrors;
    const msg = Object.entries(first)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
      .join('; ');
    throw new Error(`Données invalides: ${msg}`);
  }
  const data = parseResult.data;

  try {
    // 1. Vérifier que l'artiste existe
    const artist = await prisma.artistProfile.findUnique({
      where: { id: data.artistId },
      include: { user: true },
    });

    if (!artist) {
      throw new Error('Artiste non trouvé');
    }

    // 2. Trouver ou créer le client
    let client = await prisma.user.findUnique({
      where: { email: data.clientEmail },
    });

    if (!client) {
      client = await prisma.user.create({
        data: {
          email: data.clientEmail,
          name: data.clientName,
          phone: data.clientPhone ?? null,
          role: 'CLIENT',
        },
      });
    }

    // 3. Créer le booking en statut PENDING_PAYMENT
    const booking = await prisma.booking.create({
      data: {
        artistId: data.artistId,
        clientId: client.id,
        serviceId: data.serviceId ?? null,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMin: data.durationMin,
        type: 'SESSION',
        status: 'PENDING_PAYMENT',
        depositPaid: false,
        depositAmount: data.depositAmount,
        price: data.price,
        projectDescription: data.projectDescription ?? null,
      },
    });

    // 4. Créer la session Stripe Checkout
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY n\'est pas configuré');
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Acompte - Réservation`,
              description: `Acompte pour votre réservation du ${data.startTime.toLocaleDateString('fr-FR')}`,
            },
            unit_amount: Math.round(data.depositAmount * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: data.clientEmail,
      metadata: {
        bookingId: booking.id,
        artistId: data.artistId,
        type: 'deposit',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/booking/cancel?booking_id=${booking.id}`,
    });

    // 5. Mettre à jour le booking avec le stripeSessionId
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripeSessionId: session.id,
      },
    });

    return {
      bookingId: booking.id,
      checkoutUrl: session.url!,
    };
  } catch (error) {
    console.error('Erreur lors de la création de la session de réservation:', error);
    throw error;
  }
}
