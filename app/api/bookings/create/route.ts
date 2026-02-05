import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { createBooking } from '@/lib/calcom';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    // 1. Récupérer l'artiste
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('slug_profil', body.artistSlug)
      .single();

    if (artistError || !artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    const artistData = artist as any;

    // 2. Calculer l'acompte
    let acompteAmount = 50; // Défaut pour projet
    if (body.type === 'flash') {
      const { data: flash } = await supabase
        .from('flashs')
        .select('acompte')
        .eq('id', body.flash_id)
        .single();
      
      const flashData = flash as any;
      if (flashData?.acompte) {
        acompteAmount = flashData.acompte;
      } else {
        // Fallback: 30% du prix si acompte non défini
        const { data: flashWithPrice } = await supabase
          .from('flashs')
          .select('prix')
          .eq('id', body.flash_id)
          .single();
        
        const flashPriceData = flashWithPrice as any;
        if (flashPriceData?.prix) {
          acompteAmount = (flashPriceData.prix / 100) * 0.30;
        }
      }
    }

    // 3. Créer le booking dans Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        artist_id: artistData.id,
        type: body.type,
        flash_id: body.flash_id || null,
        project_description: body.project_description || null,
        project_zone: body.project_zone || null,
        project_budget: body.project_budget || null,
        client_name: body.client_name,
        client_email: body.client_email,
        client_phone: body.client_phone,
        scheduled_at: body.scheduled_at,
        duration_minutes: body.duration_minutes,
        acompte_amount: acompteAmount,
        status: 'pending'
      } as any)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    const bookingData = booking as any;

    // 4. Créer le PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(acompteAmount * 100), // en centimes
      currency: 'eur',
      metadata: {
        booking_id: bookingData.id,
        artist_id: artistData.id,
        client_name: body.client_name
      }
    });

    // 5. Mettre à jour le booking avec le PaymentIntent
    await (supabase
      .from('bookings') as any)
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', bookingData.id);

    // 6. Créer le booking Cal.com (si configuré)
    let calComBookingId = null;
    if (artistData.cal_com_username && artistData.cal_com_event_type_id) {
      try {
        const calComBooking = await createBooking(
          artistData.cal_com_username,
          artistData.cal_com_event_type_id,
          body.scheduled_at,
          {
            name: body.client_name,
            email: body.client_email,
            phone: body.client_phone,
          }
        );
        calComBookingId = calComBooking.id;
        
        // Mettre à jour le booking avec l'ID Cal.com
        await (supabase
          .from('bookings') as any)
          .update({ cal_com_booking_id: calComBookingId })
          .eq('id', bookingData.id);
      } catch (calComError) {
        console.error('Error creating Cal.com booking:', calComError);
        // Continue même si Cal.com échoue - le booking Supabase est créé
      }
    }

    // 7. Envoyer notification email au tatoueur (si Resend configuré)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'InkFlow <notifications@ink-flow.me>',
            to: artistData.email,
            subject: '🎨 Nouvelle réservation !',
            html: `
              <h1>Nouvelle réservation</h1>
              <p><strong>Client :</strong> ${body.client_name}</p>
              <p><strong>Type :</strong> ${body.type === 'flash' ? 'Flash' : 'Projet personnalisé'}</p>
              <p><strong>Date :</strong> ${new Date(body.scheduled_at).toLocaleString('fr-FR')}</p>
              <a href="https://ink-flow.me/dashboard/bookings/${bookingData.id}">Voir la réservation</a>
            `
          })
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue même si l'email échoue
      }
    }

    return NextResponse.json({
      bookingId: bookingData.id,
      stripeClientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create booking' },
      { status: 500 }
    );
  }
}
