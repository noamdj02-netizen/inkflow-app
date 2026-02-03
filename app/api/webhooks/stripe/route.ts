/**
 * Webhook Stripe: Gérer les événements de paiement
 * 
 * POST /api/webhooks/stripe
 * 
 * Événements gérés:
 * - payment_intent.succeeded: Confirmer le booking (PENDING_PAYMENT → CONFIRMED)
 * - payment_intent.payment_failed: Marquer le paiement comme échoué
 */

import type Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { sendBookingNotificationToArtist } from '@/lib/emails/sendArtistNotification';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function formatDateFr(date: Date): string {
  const d = new Date(date);
  const dayName = DAYS_FR[d.getDay()];
  const day = d.getDate();
  const month = MONTHS_FR[d.getMonth()];
  return `${dayName} ${day} ${month}`;
}

function formatTimeFr(date: Date): string {
  const d = new Date(date);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}h${m}`;
}

/**
 * Handler POST: Recevoir les webhooks Stripe
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  try {
    // Gérer les événements selon leur type
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;
        const paymentType = paymentIntent.metadata?.type;

        // Ne traiter que les acomptes de réservation
        if (!bookingId || paymentType !== 'booking_deposit') {
          console.log('Ignoring payment_intent.succeeded (not a booking deposit)');
          return NextResponse.json({ received: true });
        }

        // Mettre à jour le booking de manière atomique
        const booking = await prisma.$transaction(async (tx) => {
          // Vérifier que le booking existe et est toujours en PENDING_PAYMENT
          const existingBooking = await tx.booking.findUnique({
            where: { id: bookingId },
            select: {
              id: true,
              status: true,
              paymentIntent: true,
            },
          });

          if (!existingBooking) {
            throw new Error(`Booking ${bookingId} not found`);
          }

          if (existingBooking.status !== BookingStatus.PENDING_PAYMENT) {
            console.log(
              `Booking ${bookingId} already processed (status: ${existingBooking.status})`
            );
            return existingBooking;
          }

          // Vérifier que le PaymentIntent correspond
          if (existingBooking.paymentIntent !== paymentIntent.id) {
            throw new Error(
              `PaymentIntent mismatch: expected ${existingBooking.paymentIntent}, got ${paymentIntent.id}`
            );
          }

          // Mettre à jour le statut du booking
          const updatedBooking = await tx.booking.update({
            where: {
              id: bookingId,
              status: BookingStatus.PENDING_PAYMENT, // Condition atomique
            },
            data: {
              status: BookingStatus.CONFIRMED,
            },
            include: {
              client: {
                select: {
                  email: true,
                  name: true,
                },
              },
              service: {
                select: {
                  name: true,
                },
              },
              artist: {
                select: {
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

          // Enregistrer la transaction Stripe pour traçabilité
          await tx.stripeTransaction.create({
            data: {
              bookingId: bookingId,
              artistId: updatedBooking.artistId,
              stripePaymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency || 'eur',
              status: 'succeeded',
              paymentType: 'deposit',
            },
          }).catch((err) => {
            // Log mais ne pas faire échouer la transaction
            console.error('Error creating stripe_transaction:', err);
          });

          return updatedBooking;
        });

        // Envoyer la notification email au tatoueur (ne doit pas faire échouer le webhook)
        if (booking.status === BookingStatus.CONFIRMED) {
          try {
            const artistEmail = booking.artist.user.email;
            const clientName = booking.client.name ?? booking.client.email ?? 'Client';
            const projectName = booking.service.name;
            const date = formatDateFr(booking.startTime);
            const time = formatTimeFr(booking.startTime);
            const baseUrl = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? 'https://ink-flow.me').replace(/\/$/, '');
            const bookingUrl = `${baseUrl}/dashboard`;

            await sendBookingNotificationToArtist({
              artistEmail,
              clientName,
              projectName,
              date,
              time,
              bookingUrl,
            });
            console.log(`Booking ${bookingId} confirmed; notification email sent to artist`);
          } catch (emailErr) {
            console.error('Failed to send booking notification to artist (webhook continues):', emailErr);
          }
        }

        return NextResponse.json({ received: true, bookingId });
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (bookingId) {
          // Optionnel: Marquer le booking comme échoué ou le supprimer
          // Pour l'instant, on garde PENDING_PAYMENT pour permettre un réessai
          console.log(`Payment failed for booking ${bookingId}`);
          
          // Vous pouvez ajouter une logique ici pour:
          // - Envoyer un email au client
          // - Annuler automatiquement après X heures
          // - Notifier l'artiste
        }

        return NextResponse.json({ received: true });
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true });
    }
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);

    // Retourner 200 pour éviter que Stripe réessaie indéfiniment
    // Mais logger l'erreur pour debugging
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Important: 200 pour éviter les retries Stripe
    );
  }
}

// Désactiver le body parsing par défaut de Next.js pour les webhooks Stripe
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
