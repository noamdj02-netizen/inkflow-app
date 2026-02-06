/**
 * Webhook Stripe: Gérer les événements de paiement
 * 
 * POST /api/webhooks/stripe
 * 
 * Événements gérés:
 * - payment_intent.succeeded: Confirmer le booking (PENDING_PAYMENT → CONFIRMED)
 * - payment_intent.payment_failed: Marquer le paiement comme échoué
 * 
 * ⚠️ CRITIQUE: Un booking ne passe en CONFIRMED QUE SI le paiement Stripe est validé
 */

import type Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import StripeLib from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = new StripeLib(process.env.STRIPE_SECRET_KEY!);

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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
          return NextResponse.json({ received: true });
        }

        // Récupérer le booking depuis Prisma
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            artist: {
              include: {
                user: true,
              },
            },
            client: true,
          },
        });

        if (!booking) {
          console.error(`❌ Booking ${bookingId} non trouvé`);
          return NextResponse.json({ received: true });
        }

        // Vérifier que le booking est toujours en attente
        if (booking.status !== 'PENDING_PAYMENT') {
          return NextResponse.json({ received: true });
        }

        // Vérifier que la session correspond
        if (booking.stripeSessionId !== session.id) {
          console.error(`❌ Session mismatch: expected ${booking.stripeSessionId}, got ${session.id}`);
          return NextResponse.json({ received: true });
        }

        // Mettre à jour le booking en CONFIRMED
        await prisma.booking.update({
          where: {
            id: bookingId,
            status: 'PENDING_PAYMENT',
          },
          data: {
            status: 'CONFIRMED',
            depositPaid: true,
            paymentIntent: session.payment_intent as string,
            updatedAt: new Date(),
          },
        });

        // Enregistrer la transaction Stripe
        try {
          await prisma.stripeTransaction.create({
            data: {
              bookingId: bookingId,
              artistId: booking.artistId,
              stripePaymentIntentId: session.payment_intent as string,
              amount: session.amount_total || 0,
              currency: session.currency || 'eur',
              status: 'succeeded',
              paymentType: 'deposit',
            },
          });
        } catch (txError) {
          console.error('⚠️ Erreur lors de la création de la transaction:', txError);
        }

        return NextResponse.json({
          received: true,
          bookingId,
          status: 'CONFIRMED',
        });
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (!bookingId) {
          return NextResponse.json({ received: true });
        }

        // Récupérer le booking depuis Prisma
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            artist: {
              include: {
                user: true,
              },
            },
            client: true,
          },
        });

        if (!booking) {
          console.error(`❌ Booking ${bookingId} non trouvé dans la base de données`);
          return NextResponse.json({ received: true });
        }

        // ⚠️ Vérifier que le booking est toujours en attente de paiement
        if (booking.status !== 'PENDING_PAYMENT') {
          return NextResponse.json({ received: true });
        }

        // Vérifier que le PaymentIntent correspond
        if (booking.paymentIntent && booking.paymentIntent !== paymentIntent.id) {
          console.error(
            `❌ PaymentIntent mismatch: expected ${booking.paymentIntent}, got ${paymentIntent.id}`
          );
          return NextResponse.json({ received: true });
        }

        // Calculer le montant de l'acompte depuis le PaymentIntent (en centimes → euros)
        // Prisma convertit automatiquement les nombres en Decimal
        const depositAmount = paymentIntent.amount
          ? paymentIntent.amount / 100
          : booking.depositAmount?.toNumber() || null;

        // ⚠️ CRITIQUE: Mettre à jour le booking en statut CONFIRMED avec acompte payé
        // Utiliser une transaction pour garantir l'atomicité
        await prisma.booking.update({
          where: {
            id: bookingId,
            status: 'PENDING_PAYMENT', // Condition atomique: seulement si encore PENDING_PAYMENT
          },
          data: {
            status: 'CONFIRMED', // ✅ Statut confirmé
            depositPaid: true, // ✅ Acompte payé
            depositAmount: depositAmount || booking.depositAmount, // Garder l'existant si nouveau montant null
            paymentIntent: paymentIntent.id, // Stocker l'ID du PaymentIntent
            updatedAt: new Date(),
          },
        });

        // Enregistrer la transaction Stripe pour traçabilité
        try {
          await prisma.stripeTransaction.create({
            data: {
              bookingId: bookingId,
              artistId: booking.artistId,
              stripePaymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount, // En centimes
              currency: paymentIntent.currency || 'eur',
              status: 'succeeded',
              paymentType: 'deposit',
            },
          });
        } catch (txError) {
          console.error('⚠️ Erreur lors de la création de la transaction Stripe:', txError);
          // Ne pas bloquer le webhook si l'enregistrement de la transaction échoue
        }

        // Envoyer notification email au tatoueur (si Resend configuré)
        if (process.env.RESEND_API_KEY && booking.artist.user.email) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'InkFlow <notifications@ink-flow.me>',
                to: booking.artist.user.email,
                subject: '🎨 Nouvelle réservation confirmée !',
                html: `
                  <h1>Réservation confirmée</h1>
                  <p><strong>Client :</strong> ${booking.client.name || booking.client.email}</p>
                  <p><strong>Type :</strong> ${booking.type}</p>
                  <p><strong>Date :</strong> ${booking.startTime.toLocaleString('fr-FR')}</p>
                  <p><strong>Acompte :</strong> ${depositAmount}€</p>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ink-flow.me'}/dashboard/calendar">Voir la réservation</a>
                `
              })
            });
          } catch (emailErr) {
            console.error('⚠️ Failed to send booking notification (webhook continues):', emailErr);
          }
        }

        return NextResponse.json({
          received: true,
          bookingId,
          status: 'CONFIRMED',
          depositPaid: true,
        });
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (bookingId) {
          // Enregistrer la transaction échouée pour traçabilité
          try {
            const booking = await prisma.booking.findUnique({
              where: { id: bookingId },
            });

            if (booking) {
              await prisma.stripeTransaction.create({
                data: {
                  bookingId: bookingId,
                  artistId: booking.artistId,
                  stripePaymentIntentId: paymentIntent.id,
                  amount: paymentIntent.amount,
                  currency: paymentIntent.currency || 'eur',
                  status: 'failed',
                  paymentType: 'deposit',
                },
              });
            }
          } catch (error) {
            console.error('⚠️ Erreur lors de l\'enregistrement de la transaction échouée:', error);
          }

          // Le booking reste en PENDING_PAYMENT pour permettre un réessai
          // Ne pas le mettre en CANCELLED automatiquement
        }

        return NextResponse.json({ received: true });
      }

      default:
        return NextResponse.json({ received: true });
    }
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);

    // Retourner 200 pour éviter que Stripe réessaie indéfiniment
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}

// Désactiver le body parsing par défaut de Next.js pour les webhooks Stripe
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
