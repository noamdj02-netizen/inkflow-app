import { createClient } from '@supabase/supabase-js';
import { careInstructionsSchema, escapeHtml, sanitizeText } from '../utils/validation';

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function requireEnv(name: string) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

function textToHtml(text: string) {
  // Preserve line breaks safely
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

async function sendResendEmail(args: { to: string; subject: string; html: string; text: string; reply_to?: string }) {
  const apiKey = requireEnv('RESEND_API_KEY');
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');

  const from = requireEnv('RESEND_FROM_EMAIL') || 'InkFlow <onboarding@resend.dev>';

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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.message || (data as any)?.error || `Resend error (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method not allowed' });

  const supabaseUrl = requireEnv('SUPABASE_URL') || requireEnv('VITE_SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY') || requireEnv('VITE_SUPABASE_ANON_KEY');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(res, 500, {
      success: false,
      error: 'Missing server env vars (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)',
    });
  }

  const authHeader = String(req.headers?.authorization || '');
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return json(res, 401, { success: false, error: 'Missing Authorization token' });

  // Normalize body (Vercel can send string or pre-parsed object)
  let rawBody: unknown = req.body;
  if (typeof req.body === 'string') {
    try {
      rawBody = req.body ? JSON.parse(req.body) : {};
    } catch {
      return json(res, 400, { success: false, error: 'Invalid JSON body' });
    }
  } else if (req.body == null) {
    rawBody = {};
  }

  // Validate input with Zod (strict mode)
  const bodyParseResult = careInstructionsSchema.safeParse(rawBody);
  if (!bodyParseResult.success) {
    const firstError = bodyParseResult.error.issues[0];
    return json(res, 400, {
      success: false,
      error: firstError?.message || 'Validation failed',
      details: process.env.NODE_ENV === 'development' ? bodyParseResult.error.issues : undefined,
    });
  }
  const body = bodyParseResult.data;

  // Validate the caller using anon client + JWT
  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const authedUserId = userData?.user?.id || null;
  if (userError || !authedUserId) return json(res, 401, { success: false, error: 'Invalid token' });

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Load project + artist
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, artist_id, client_email, client_name, body_part, style, care_template_id, custom_care_instructions')
    .eq('id', body.project_id)
    .single();

  if (projectError || !project) return json(res, 404, { success: false, error: 'Project not found' });
  if (project.artist_id !== authedUserId) return json(res, 403, { success: false, error: 'Forbidden' });

  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('id, email, nom_studio')
    .eq('id', project.artist_id)
    .single();

  if (artistError || !artist) return json(res, 404, { success: false, error: 'Artist not found' });

  const effectiveTemplateId = body.care_template_id ?? project.care_template_id ?? null;
  const effectiveCustom = (body.custom_care_instructions ?? project.custom_care_instructions ?? '').trim();

  let contentText = effectiveCustom;
  if (!contentText && effectiveTemplateId) {
    const { data: tpl, error: tplError } = await supabase
      .from('care_templates')
      .select('id, artist_id, title, content')
      .eq('id', effectiveTemplateId)
      .single();

    if (tplError || !tpl) return json(res, 404, { success: false, error: 'Care template not found' });
    if (tpl.artist_id !== artist.id) return json(res, 403, { success: false, error: 'Forbidden template' });
    contentText = tpl.content;
  }

  if (!contentText.trim()) {
    return json(res, 400, { success: false, error: 'No care instructions content (select a template or write custom notes).' });
  }

  // Persist selection/override + track send
  const nowIso = new Date().toISOString();
  await supabase
    .from('projects')
    .update({
      care_template_id: effectiveTemplateId,
      custom_care_instructions: effectiveCustom ? effectiveCustom : null,
      care_sent_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', project.id)
    .eq('artist_id', artist.id);

  // Send email
  const subject = `Soins post-tatouage — ${artist.nom_studio}`;
  const safeStudio = escapeHtml(artist.nom_studio);
  const safeClient = escapeHtml(project.client_name || 'Client');
  const safeBodyPart = escapeHtml(project.body_part);
  const safeStyle = escapeHtml(project.style);

  const html = `
    <div style="background:#0b0b0b;padding:24px;border-radius:16px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
      <div style="max-width:640px;margin:0 auto">
        <div style="margin-bottom:14px;color:#a1a1aa;font-size:12px;letter-spacing:0.14em;text-transform:uppercase">
          ${safeStudio}
        </div>
        <h1 style="margin:0 0 10px 0;font-size:22px;line-height:1.25">Soins post‑tatouage</h1>
        <p style="margin:0 0 14px 0;color:#d4d4d8">
          Bonjour <strong style="color:#fff">${safeClient}</strong>,<br/>
          voici les consignes pour votre tatouage (<span style="color:#fff">${safeBodyPart}</span> • <span style="color:#fff">${safeStyle}</span>).
        </p>

        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:16px">
          <div style="font-weight:700;margin-bottom:8px">Instructions</div>
          <div style="color:#e5e7eb">${textToHtml(contentText)}</div>
        </div>

        <p style="margin:14px 0 0 0;color:#a1a1aa;font-size:12px">
          Si vous avez une question, répondez simplement à cet email.
        </p>
      </div>
    </div>
  `.trim();

  const text = [
    `Soins post-tatouage — ${artist.nom_studio}`,
    '',
    `Bonjour ${project.client_name || 'Client'},`,
    `Consignes pour votre tatouage (${project.body_part} • ${project.style}) :`,
    '',
    contentText,
    '',
    `Répondez à cet email si besoin.`,
  ].join('\n');

  await sendResendEmail({
    to: project.client_email,
    subject,
    html,
    text,
    reply_to: artist.email,
  });

  return json(res, 200, { success: true, care_sent_at: nowIso });
}

