/**
 * API Route: Créer une réservation sécurisée avec vérification anti-collision
 * 
 * POST /api/bookings/create
 * 
 * Règles métier:
 * 1. Vérification anti-collision (bookings CONFIRMED/PENDING_PAYMENT + leaves)
 * 2. Création booking avec statut PENDING_PAYMENT
 * 3. Création PaymentIntent Stripe pour acompte
 * 4. Transaction atomique Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { checkSlotAvailability } from '@/lib/booking-utils';

// Types pour la requête
type CreateBookingRequest = {
  clientId: string;
  artistId: string;
  serviceId: string;
  startTime: string; // ISO 8601 string
};


/**
 * Handler POST: Créer une réservation
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingRequest = await request.json();

    // Validation des entrées
    if (!body.clientId || !body.artistId || !body.serviceId || !body.startTime) {
      return NextResponse.json(
        { error: 'Champs manquants: clientId, artistId, serviceId, startTime sont requis' },
        { status: 400 }
      );
    }

    // Parser la date de début
    const startTime = new Date(body.startTime);
    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        { error: 'Format de date invalide (attendu ISO 8601)' },
        { status: 400 }
      );
    }

    // Vérifier que le créneau est dans le futur
    if (startTime.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Le créneau doit être dans le futur' },
        { status: 400 }
      );
    }

    // Récupérer le service pour obtenir la durée et le montant de l'acompte
    const service = await prisma.service.findUnique({
      where: { id: body.serviceId },
      include: {
        artist: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que le service appartient à l'artiste
    if (service.artistId !== body.artistId) {
      return NextResponse.json(
        { error: 'Ce service n\'appartient pas à cet artiste' },
        { status: 403 }
      );
    }

    // Calculer l'heure de fin
    const endTime = new Date(startTime.getTime() + service.durationMin * 60 * 1000);

    // Vérifier la disponibilité AVANT la transaction
    const availabilityCheck = await checkSlotAvailability(
      body.artistId,
      startTime,
      endTime
    );

    if (!availabilityCheck.available) {
      return NextResponse.json(
        { 
          error: 'Créneau non disponible',
          reason: availabilityCheck.reason,
          code: 'SLOT_UNAVAILABLE'
        },
        { status: 409 }
      );
    }

    // Vérifier que l'artiste a configuré Stripe
    if (!service.artist.stripeAccountId || !service.artist.stripeOnboardingComplete) {
      return NextResponse.json(
        { 
          error: 'L\'artiste n\'a pas configuré son compte bancaire',
          code: 'STRIPE_NOT_CONFIGURED'
        },
        { status: 400 }
      );
    }

    // Transaction atomique: Créer le booking + PaymentIntent Stripe
    const result = await prisma.$transaction(async (tx) => {
      // Vérification atomique FINALE (juste avant l'insertion)
      const finalAvailabilityCheck = await checkSlotAvailability(
        body.artistId,
        startTime,
        endTime
      );

      if (!finalAvailabilityCheck.available) {
        throw new Error(`Créneau pris entre-temps: ${finalAvailabilityCheck.reason}`);
      }

      // Créer le booking avec statut PENDING_PAYMENT
      const booking = await tx.booking.create({
        data: {
          clientId: body.clientId,
          artistId: body.artistId,
          serviceId: body.serviceId,
          startTime,
          endTime,
          status: BookingStatus.PENDING_PAYMENT,
        },
        include: {
          client: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              depositAmount: true,
            },
          },
          artist: {
            select: {
              id: true,
              slug: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Créer le PaymentIntent Stripe pour l'acompte
      // Convertir Decimal en nombre (centimes) - Prisma Decimal est déjà en euros
      const depositAmountCents = Math.round(Number(service.depositAmount) * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: depositAmountCents, // En centimes
        currency: 'eur',
        application_fee_amount: Math.round(depositAmountCents * 0.05), // 5% commission
        transfer_data: {
          destination: service.artist.stripeAccountId!,
        },
        description: `Acompte - ${service.name} - ${service.artist.user.name || service.artist.slug}`,
        metadata: {
          booking_id: booking.id,
          artist_id: body.artistId,
          service_id: body.serviceId,
          client_id: body.clientId,
          deposit_amount: depositAmountCents.toString(),
          total_price: Math.round(Number(service.price) * 100).toString(),
          type: 'booking_deposit',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Mettre à jour le booking avec l'ID du PaymentIntent
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentIntent: paymentIntent.id,
        },
        include: {
          client: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              depositAmount: true,
            },
          },
        },
      });

      return {
        booking: updatedBooking,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: result.booking.id,
          startTime: result.booking.startTime,
          endTime: result.booking.endTime,
          status: result.booking.status,
          service: result.booking.service,
        },
        paymentIntent: result.paymentIntent,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating booking:', error);

    // Gestion d'erreurs spécifiques
    if (error instanceof Error) {
      // Erreur de disponibilité (race condition détectée)
      if (error.message.includes('Créneau pris entre-temps')) {
        return NextResponse.json(
          {
            error: 'Ce créneau vient d\'être réservé par quelqu\'un d\'autre',
            code: 'SLOT_TAKEN',
            reason: error.message,
          },
          { status: 409 }
        );
      }

      // Erreur Stripe
      if (error.message.includes('Stripe')) {
        return NextResponse.json(
          {
            error: 'Erreur lors de la création du paiement',
            code: 'STRIPE_ERROR',
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Une erreur est survenue lors de la création de la réservation',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
