/**
 * Route unifiée trial (≤12 functions Vercel Hobby).
 * Rewrites: /api/ensure-trial, /api/expire-trial, /api/trial-reminder → /api/trial?action=...
 * action=ensure | expire | reminder
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

async function sendTrialEmail(to: string, subject: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = getEnv('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'Missing RESEND_API_KEY' };
  const from = getEnv('RESEND_FROM_EMAIL') || 'InkFlow <onboarding@resend.dev>';
  const html = text
    .replace(/\n/g, '<br/>')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html: `<div style="font-family:sans-serif;max-width:560px;">${html}</div>`, text }),
  });
  const data = (await r.json().catch(() => ({}))) as { message?: string; error?: string };
  if (!r.ok) return { ok: false, error: data?.message || data?.error || `HTTP ${r.status}` };
  return { ok: true };
}

export default async function handler(req: any, res: any) {
  const action = (req.query?.action as string) || (req.url?.includes('trial-reminder') ? 'reminder' : req.url?.includes('expire-trial') ? 'expire' : req.url?.includes('ensure-trial') ? 'ensure' : '');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (action === 'reminder') {
    if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    try {
      const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
      const supabase = createClient(supabaseUrl, requireEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
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
      const text = 'Votre essai InkFlow se termine dans 48h. Pour continuer à gérer vos tatouages sans interruption, choisissez votre plan : Starter (29€), Pro (49€) ou Studio (99€).';
      for (const user of users || []) {
        const email = (user as { email?: string }).email?.trim();
        if (!email) continue;
        const result = await sendTrialEmail(email, subject, text);
        if (result.ok) {
          sent.push((user as { id: string }).id);
          await supabase.from('users').update({ trial_reminder_sent_at: new Date().toISOString() } as Record<string, unknown>).eq('id', (user as { id: string }).id);
        } else failed.push({ id: (user as { id: string }).id, error: result.error || 'Unknown' });
      }
      return json(res, 200, { ok: true, sent: sent.length, failed: failed.length, userIds: sent, errors: failed.length ? failed : undefined });
    } catch (err: any) {
      console.error('[trial-reminder] Error:', err);
      return json(res, 500, { error: err.message || 'Server error' });
    }
  }

  if (action === 'ensure' || action === 'expire') {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    let body: { userId?: string };
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    } catch {
      return json(res, 400, { error: 'Invalid JSON' });
    }
    const userId = body.userId?.trim();
    if (!userId) return json(res, 400, { error: 'Missing userId' });

    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabase = createClient(supabaseUrl, requireEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });

    if (action === 'ensure') {
      try {
        const { data: existing } = await supabase.from('users').select('id').eq('id', userId).single();
        if (existing) return json(res, 200, { ok: true, created: false });
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
        if (authError || !authUser?.user) return json(res, 404, { error: 'User not found in Auth' });
        const email = (authUser.user.email || '').trim() || 'unknown@inkflow.local';
        const name = (authUser.user.user_metadata?.full_name as string) || (authUser.user.user_metadata?.name as string) || (email ? email.split('@')[0] : '') || 'Utilisateur';
        const now = new Date();
        const trialEndsAt = new Date(now);
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const { error: insertError } = await supabase.from('users').insert({
          id: authUser.user.id,
          email,
          name: name.slice(0, 255) || 'Utilisateur',
          subscription_status: 'trialing',
          subscription_plan: 'STARTER',
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
        } as Record<string, unknown>);
        if (insertError) {
          if (insertError.code === '23505') return json(res, 200, { ok: true, created: false });
          console.error('[ensure-trial] Insert error:', insertError);
          return json(res, 500, { error: insertError.message });
        }
        return json(res, 200, { ok: true, created: true });
      } catch (err: any) {
        console.error('[ensure-trial] Error:', err);
        return json(res, 500, { error: err.message || 'Server error' });
      }
    }

    if (action === 'expire') {
      try {
        const { data: user, error: fetchError } = await supabase.from('users').select('id, subscription_status, trial_ends_at').eq('id', userId).single();
        if (fetchError || !user) return json(res, 404, { error: 'User not found' });
        const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
        const now = new Date();
        if (!trialEndsAt || now <= trialEndsAt) return json(res, 200, { ok: true, expired: false });
        const { error: updateError } = await supabase.from('users').update({ subscription_status: 'expired' } as Record<string, unknown>).eq('id', userId);
        if (updateError) {
          console.error('[expire-trial] Update failed:', updateError);
          return json(res, 500, { error: 'Failed to update status' });
        }
        return json(res, 200, { ok: true, expired: true, redirect: '/dashboard' });
      } catch (err: any) {
        console.error('[expire-trial] Error:', err);
        return json(res, 500, { error: err.message || 'Server error' });
      }
    }
  }

  return json(res, 400, { error: 'Missing or invalid action. Use ?action=ensure|expire|reminder' });
}
