// @ts-nocheck
// Supabase Edge Function: send-appointment-reminders
// Trigger: Scheduled (cron) - sends email reminders 48h before appointment
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

type BookingRow = {
  id: string;
  client_email: string;
  client_name: string | null;
  date_debut: string;
  prix_total: number;
  deposit_amount: number;
  flash_id: string | null;
  project_id: string | null;
  artist_id: string;
  flashs?: { title: string } | null;
  projects?: { body_part: string; style: string } | null;
  artists?: { nom_studio: string; email: string; pre_tattoo_instructions: string | null } | null;
};

function getEnvNumber(name: string, fallback: number) {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateFr(iso: string) {
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

async function sendWithResend(args: {
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

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    // Optional shared secret for manual calls
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret) {
      const provided = req.headers.get('x-cron-secret');
      if (provided !== cronSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const dryRun = new URL(req.url).searchParams.get('dry_run') === '1';

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const lookaheadHours = getEnvNumber('REMINDER_LOOKAHEAD_HOURS', 48);
    const windowMinutes = getEnvNumber('REMINDER_WINDOW_MINUTES', 60);

    const now = new Date();
    const start = new Date(now.getTime() + lookaheadHours * 60 * 60 * 1000);
    const end = new Date(start.getTime() + windowMinutes * 60 * 1000);

    // Fetch bookings scheduled within [start, end)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        client_email,
        client_name,
        date_debut,
        prix_total,
        deposit_amount,
        flash_id,
        project_id,
        artist_id,
        flashs(title),
        projects(body_part,style),
        artists:artist_id(nom_studio,email,pre_tattoo_instructions)
      `
      )
      .eq('statut_booking', 'confirmed')
      .is('reminder_sent_at', null)
      .gte('date_debut', start.toISOString())
      .lt('date_debut', end.toISOString());

    if (error) {
      console.error('Query error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const list = (bookings || []) as unknown as BookingRow[];

    let sent = 0;
    let failed = 0;
    const results: Array<{ booking_id: string; status: 'sent' | 'skipped' | 'failed'; error?: string }> = [];

    for (const b of list) {
      try {
        const artist = b.artists;
        const studioName = artist?.nom_studio || 'InkFlow';
        const when = formatDateFr(b.date_debut);
        const clientName = b.client_name || 'Client';

        const itemLine = b.flash_id
          ? `Flash: ${b.flashs?.title || '—'}`
          : `Projet: ${b.projects?.body_part || '—'}${b.projects?.style ? ` (${b.projects.style})` : ''}`;

        const remaining = Math.max(0, (b.prix_total || 0) - (b.deposit_amount || 0));
        const remainingEur = (remaining / 100).toFixed(2);

        const instructions = (artist?.pre_tattoo_instructions || '').trim();
        const defaultInstructions = [
          `- Évitez l'alcool 24h avant`,
          `- Mangez correctement avant le rendez-vous`,
          `- Dormez bien la veille`,
          `- Hydratez votre peau (sans irritation)`,
        ].join('\n');

        const finalInstructions = instructions || defaultInstructions;

        const subject = `Rappel : rendez-vous dans 48h — ${studioName}`;

        const text = [
          `Bonjour ${clientName},`,
          '',
          `Petit rappel : votre rendez-vous est prévu le ${when}.`,
          itemLine,
          `Montant restant estimé: ${remainingEur}€`,
          '',
          `Consignes avant le rendez-vous:`,
          finalInstructions,
          '',
          `À bientôt,`,
          studioName,
        ].join('\n');

        const html = `
          <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#0f172a;">
            <h2 style="margin:0 0 12px 0;">Rappel de rendez-vous (J-2)</h2>
            <p style="margin:0 0 10px 0;">Bonjour <strong>${escapeHtml(clientName)}</strong>,</p>
            <p style="margin:0 0 10px 0;">Petit rappel : votre rendez-vous est prévu le <strong>${escapeHtml(when)}</strong>.</p>
            <p style="margin:0 0 10px 0;">${escapeHtml(itemLine)}<br/>Montant restant estimé : <strong>${escapeHtml(remainingEur)}€</strong></p>
            <div style="margin:14px 0; padding:12px 14px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
              <div style="font-weight:700; margin-bottom:6px;">Consignes avant le rendez-vous</div>
              <pre style="margin:0; white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';">${escapeHtml(finalInstructions)}</pre>
            </div>
            <p style="margin:14px 0 0 0;">À bientôt,<br/><strong>${escapeHtml(studioName)}</strong></p>
          </div>
        `.trim();

        if (dryRun) {
          results.push({ booking_id: b.id, status: 'skipped' });
          continue;
        }

        await sendWithResend({
          to: b.client_email,
          subject,
          html,
          text,
          reply_to: artist?.email || undefined,
        });

        // Mark reminder as sent (idempotent update)
        await supabase
          .from('bookings')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', b.id)
          .is('reminder_sent_at', null);

        sent += 1;
        results.push({ booking_id: b.id, status: 'sent' });
      } catch (e: any) {
        failed += 1;
        results.push({ booking_id: b.id, status: 'failed', error: e?.message || 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        dryRun,
        window: { start: start.toISOString(), end: end.toISOString() },
        found: list.length,
        sent,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('send-appointment-reminders error:', error);
    return new Response(JSON.stringify({ ok: false, error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

