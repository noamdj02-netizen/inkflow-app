// @ts-nocheck
// Supabase Edge Function: envoi des emails après une réservation réussie (acompte payé)
// Appelée par le webhook Stripe (checkout.session.completed) de façon asynchrone.
// - Email tatoueur : Nom du client, Date/Heure, Description du projet
// - Email client : confirmation rassurante

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function escapeHtml(s: string) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateHeureFr(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

async function sendResend(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
}) {
  const apiKey = Deno.env.get('RESEND_API_KEY') || '';
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');

  const from = Deno.env.get('RESEND_FROM_EMAIL') || 'InkFlow <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      reply_to: args.reply_to,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error || `Resend error (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

type BookingRow = {
  id: string;
  client_email: string;
  client_name: string | null;
  date_debut: string;
  date_fin: string;
  duree_minutes: number;
  flash_id: string | null;
  project_id: string | null;
  artist_id: string;
  flashs?: { title: string } | null;
  projects?: { body_part: string; style: string; description: string } | null;
  artists?: { email: string; nom_studio: string } | null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await req.json()) as { booking_id?: string };
    const bookingId = body?.booking_id;

    if (!bookingId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing booking_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Server config missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        client_email,
        client_name,
        date_debut,
        date_fin,
        duree_minutes,
        flash_id,
        project_id,
        artist_id,
        flashs(title),
        projects(body_part,style,description),
        artists:artist_id(email,nom_studio)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingId, bookingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const row = booking as unknown as BookingRow;
    const artistEmail = row.artists?.email;
    const artistName = row.artists?.nom_studio || 'Votre studio';
    const clientEmail = row.client_email;
    const clientName = row.client_name || 'Client';
    const dateDebut = row.date_debut;
    const dateFin = row.date_fin;
    const dateHeureStr = formatDateHeureFr(dateDebut);

    // Description du projet : flash (titre) ou projet (body_part, style, description)
    let descriptionProjet: string;
    if (row.flash_id && row.flashs?.title) {
      descriptionProjet = `Flash : ${row.flashs.title}`;
    } else if (row.project_id && row.projects) {
      const p = row.projects;
      descriptionProjet = `Projet personnalisé : ${p.body_part || ''} - ${p.style || ''}. ${(p.description || '').slice(0, 200)}${(p.description || '').length > 200 ? '…' : ''}`;
    } else {
      descriptionProjet = 'Réservation';
    }

    const descriptionEscaped = escapeHtml(descriptionProjet);
    const clientNameEscaped = escapeHtml(clientName);
    const dateHeureEscaped = escapeHtml(dateHeureStr);

    // --- Email au tatoueur : Nom du client, Date/Heure, Description du projet
    const artistSubject = `Nouvelle réservation – ${clientName}`;
    const artistHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nouvelle réservation</title></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #0a0a0a;">Nouvelle réservation</h2>
  <p>Une nouvelle réservation a été enregistrée sur InkFlow.</p>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Nom du client</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${clientNameEscaped}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date et heure</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dateHeureEscaped}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Description du projet</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${descriptionEscaped}</td></tr>
  </table>
  <p style="margin-top: 24px; color: #666; font-size: 14px;">Connectez-vous à votre tableau de bord InkFlow pour voir tous les détails.</p>
</body>
</html>`;
    const artistText = `Nouvelle réservation\n\nNom du client : ${clientName}\nDate et heure : ${dateHeureStr}\nDescription du projet : ${descriptionProjet}\n\nConnectez-vous à votre tableau de bord InkFlow pour plus de détails.`;

    // --- Email au client : confirmation rassurante
    const clientSubject = 'Votre réservation est confirmée';
    const clientHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Réservation confirmée</title></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #0a0a0a;">Votre demande est bien prise en compte</h2>
  <p>Bonjour ${clientNameEscaped},</p>
  <p>Nous vous confirmons que votre réservation a bien été enregistrée. Vous recevrez un rappel avant votre rendez-vous.</p>
  <p><strong>Date et heure :</strong> ${dateHeureEscaped}</p>
  <p>Si vous avez la moindre question, n'hésitez pas à contacter directement le studio.</p>
  <p style="margin-top: 32px; color: #666; font-size: 14px;">À bientôt,<br>L'équipe ${escapeHtml(artistName)}</p>
</body>
</html>`;
    const clientText = `Votre demande est bien prise en compte\n\nBonjour ${clientName},\n\nNous vous confirmons que votre réservation a bien été enregistrée. Vous recevrez un rappel avant votre rendez-vous.\n\nDate et heure : ${dateHeureStr}\n\nSi vous avez la moindre question, contactez directement le studio.\n\nÀ bientôt,\nL'équipe ${artistName}`;

    // Envoi des deux emails en parallèle (asynchrone côté Resend, pas de blocage)
    const results = await Promise.allSettled([
      artistEmail
        ? sendResend({
            to: artistEmail,
            subject: artistSubject,
            html: artistHtml,
            text: artistText,
          })
        : Promise.resolve(null),
      sendResend({
        to: clientEmail,
        subject: clientSubject,
        html: clientHtml,
        text: clientText,
      }),
    ]);

    const artistOk = results[0].status === 'fulfilled';
    const clientOk = results[1].status === 'fulfilled';
    if (!artistOk && results[0].status === 'rejected') {
      console.error('Failed to send artist notification:', results[0].reason);
    }
    if (!clientOk && results[1].status === 'rejected') {
      console.error('Failed to send client notification:', results[1].reason);
    }

    return new Response(
      JSON.stringify({
        success: clientOk,
        artist_email_sent: artistOk,
        client_email_sent: clientOk,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    console.error('send-booking-notifications error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
