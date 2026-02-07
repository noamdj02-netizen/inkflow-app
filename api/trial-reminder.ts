/**
 * GET/POST /api/trial-reminder
 * Envoie un email "Ton essai se termine dans 2 jours" aux utilisateurs en trialing
 * dont trial_ends_at est dans 2 jours. À appeler via Vercel Cron (ex: quotidien).
 */

import { createClient } from '@supabase/supabase-js';

function json(res: any, status: number, body: unknown) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

function getEnv(name: string): string | null {
  const v = process.env[name];
  return v && typeof v === 'string' && v.trim() ? v.trim() : null;
}

async function sendEmail(to: string, subject: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = getEnv('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'Missing RESEND_API_KEY' };
  const from = getEnv('RESEND_FROM_EMAIL') || 'InkFlow <onboarding@resend.dev>';

  const html = text
    .replace(/\n/g, '<br/>')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: `<div style="font-family:sans-serif;max-width:560px;">${html}</div>`,
      text,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
  if (!res.ok) return { ok: false, error: data?.message || data?.error || `HTTP ${res.status}` };
  return { ok: true };
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date();
    const inTwoDaysStart = new Date(now);
    inTwoDaysStart.setDate(inTwoDaysStart.getDate() + 2);
    inTwoDaysStart.setHours(0, 0, 0, 0);
    const inTwoDaysEnd = new Date(inTwoDaysStart);
    inTwoDaysEnd.setDate(inTwoDaysEnd.getDate() + 1);

    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, trial_ends_at')
      .eq('subscription_status', 'trialing')
      .not('trial_ends_at', 'is', null)
      .is('trial_reminder_sent_at', null)
      .gte('trial_ends_at', inTwoDaysStart.toISOString())
      .lt('trial_ends_at', inTwoDaysEnd.toISOString());

    if (fetchError) {
      console.error('[trial-reminder] Fetch error:', fetchError);
      return json(res, 500, { error: fetchError.message });
    }

    const sent: string[] = [];
    const failed: { id: string; error: string }[] = [];

    const subject = 'Votre essai InkFlow se termine dans 48h';
    const text =
      'Votre essai InkFlow se termine dans 48h. Pour continuer à gérer vos tatouages sans interruption, choisissez votre plan : Starter (29€), Pro (49€) ou Studio (99€).';

    for (const user of users || []) {
      const email = (user as { email?: string }).email?.trim();
      if (!email) continue;

      const result = await sendEmail(email, subject, text);
      if (result.ok) {
        sent.push((user as { id: string }).id);
        await supabase
          .from('users')
          .update({ trial_reminder_sent_at: new Date().toISOString() } as Record<string, unknown>)
          .eq('id', (user as { id: string }).id);
      } else {
        failed.push({ id: (user as { id: string }).id, error: result.error || 'Unknown' });
      }
    }

    return json(res, 200, {
      ok: true,
      sent: sent.length,
      failed: failed.length,
      userIds: sent,
      errors: failed.length ? failed : undefined,
    });
  } catch (err: any) {
    console.error('[trial-reminder] Error:', err);
    return json(res, 500, { error: err.message || 'Server error' });
  }
}
