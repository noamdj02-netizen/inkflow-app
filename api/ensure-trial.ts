/**
 * POST /api/ensure-trial
 * Crée l'utilisateur dans public.users avec essai 14j s'il n'existe pas (Free Trial First).
 * À appeler côté client quand l'utilisateur est connecté mais n'a pas encore de ligne users.
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

    const { data: existing } = await supabase.from('users').select('id').eq('id', userId).single();

    if (existing) {
      return json(res, 200, { ok: true, created: false });
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      return json(res, 404, { error: 'User not found in Auth' });
    }

    const email = (authUser.user.email || '').trim() || 'unknown@inkflow.local';
    const name =
      (authUser.user.user_metadata?.full_name as string) ||
      (authUser.user.user_metadata?.name as string) ||
      (email ? email.split('@')[0] : '') ||
      'Utilisateur';

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
