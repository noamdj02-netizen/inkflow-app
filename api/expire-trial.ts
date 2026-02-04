/**
 * POST /api/expire-trial
 * Passe le statut d'abonnement en 'expired' si la période d'essai est dépassée.
 * Body: { userId: string }
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

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    let body: { userId?: string };
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    } catch {
      return json(res, 400, { error: 'Invalid JSON' });
    }

    const userId = body.userId?.trim();
    if (!userId) {
      return json(res, 400, { error: 'Missing userId' });
    }

    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, subscription_status, trial_ends_at')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return json(res, 404, { error: 'User not found' });
    }

    const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
    const now = new Date();

    if (!trialEndsAt || now <= trialEndsAt) {
      return json(res, 200, { ok: true, expired: false });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ subscription_status: 'expired' } as Record<string, unknown>)
      .eq('id', userId);

    if (updateError) {
      console.error('[expire-trial] Update failed:', updateError);
      return json(res, 500, { error: 'Failed to update status' });
    }

    return json(res, 200, { ok: true, expired: true, redirect: '/subscribe' });
  } catch (err: any) {
    console.error('[expire-trial] Error:', err);
    return json(res, 500, { error: err.message || 'Server error' });
  }
}
