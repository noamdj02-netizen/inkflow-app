/**
 * Webhook Stripe: Gérer les événements de paiement
 * 
 * POST /api/webhooks/stripe
 * 
 * Événements gérés:
 * - payment_intent.succeeded: Confirmer le booking (pending → confirmed)
 * - payment_intent.payment_failed: Marquer le paiement comme échoué
 */

import type Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import StripeLib from 'stripe';
import { createBooking } from '@/lib/calcom';

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
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (!bookingId) {
          return NextResponse.json({ received: true });
        }

        const supabase = createClient();

        // Récupérer le booking
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            artists (cal_com_username, cal_com_event_type_id, email, nom_studio)
          `)
          .eq('id', bookingId)
          .single();

        if (bookingError || !booking) {
          console.error(`Booking ${bookingId} not found`);
          return NextResponse.json({ received: true });
        }

        const bookingData = booking as any;

        // Vérifier que le booking est toujours pending
        if (bookingData.status !== 'pending') {
          return NextResponse.json({ received: true });
        }

        // Vérifier que le PaymentIntent correspond
        if (bookingData.stripe_payment_intent_id !== paymentIntent.id) {
          console.error(
            `PaymentIntent mismatch: expected ${bookingData.stripe_payment_intent_id}, got ${paymentIntent.id}`
          );
          return NextResponse.json({ received: true });
        }

        // Créer le booking Cal.com si pas encore créé et si configuré
        let calComBookingId = bookingData.cal_com_booking_id;
        const artist = bookingData.artists as any;
        
        if (!calComBookingId && artist?.cal_com_username && artist?.cal_com_event_type_id) {
          try {
            const calComBooking = await createBooking(
              artist.cal_com_username,
              artist.cal_com_event_type_id,
              bookingData.scheduled_at,
              {
                name: bookingData.client_name || 'Client',
                email: bookingData.client_email,
                phone: bookingData.client_phone || '',
              }
            );
            calComBookingId = calComBooking.id;
          } catch (calComError) {
            console.error('Error creating Cal.com booking:', calComError);
            // Continue même si Cal.com échoue
          }
        }

        // Mettre à jour le booking: status = confirmed, acompte_paid = true
        const { error: updateError } = await (supabase
          .from('bookings') as any)
          .update({
            status: 'confirmed',
            acompte_paid: true,
            cal_com_booking_id: calComBookingId || bookingData.cal_com_booking_id,
            confirmed_by_artist_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
          .eq('status', 'pending'); // Condition atomique

        if (updateError) {
          console.error('Error updating booking:', updateError);
          return NextResponse.json({ received: true });
        }

        // Envoyer notification email au tatoueur (si Resend configuré)
        if (process.env.RESEND_API_KEY && artist?.email) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'InkFlow <notifications@ink-flow.me>',
                to: artist.email,
                subject: '🎨 Nouvelle réservation confirmée !',
                html: `
                  <h1>Réservation confirmée</h1>
                  <p><strong>Client :</strong> ${bookingData.client_name || bookingData.client_email}</p>
                  <p><strong>Type :</strong> ${bookingData.type === 'flash' ? 'Flash' : 'Projet personnalisé'}</p>
                  <p><strong>Date :</strong> ${new Date(bookingData.scheduled_at).toLocaleString('fr-FR')}</p>
                  <p><strong>Acompte :</strong> ${bookingData.acompte_amount}€</p>
                  <a href="https://ink-flow.me/dashboard/bookings/${bookingId}">Voir la réservation</a>
                `
              })
            });
          } catch (emailErr) {
            console.error('Failed to send booking notification (webhook continues):', emailErr);
          }
        }

        return NextResponse.json({ received: true, bookingId });
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (bookingId) {
          // Optionnel: Marquer le booking comme échoué ou envoyer un email
          // Pour l'instant, on garde le statut pending pour permettre un réessai
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
