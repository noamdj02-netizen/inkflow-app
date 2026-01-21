import { createClient } from '@supabase/supabase-js';

type SubmitProjectBody = {
  artist_id: string;
  client_email: string;
  client_name: string;
  body_part: string;
  size_cm: number;
  style: string;
  description: string;
  budget_max?: number | null;
  is_cover_up?: boolean;
  is_first_tattoo?: boolean;
  availability?: string[] | null;
  reference_images?: string[] | null;
  ai_estimated_hours?: number | null;
  ai_complexity_score?: number | null;
  ai_price_range?: string | null;
  ai_technical_notes?: string | null;
};

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function requireEnv(name: string) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
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

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method not allowed' });

  const supabaseUrl = requireEnv('SUPABASE_URL') || requireEnv('VITE_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json(res, 500, {
      success: false,
      error: 'Missing server env vars (SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY)',
    });
  }

  const body = (req.body || {}) as SubmitProjectBody;
  const required = ['artist_id', 'client_email', 'client_name', 'body_part', 'style', 'description'] as const;
  for (const k of required) {
    if (!body[k] || String(body[k]).trim().length === 0) {
      return json(res, 400, { success: false, error: `Missing ${k}` });
    }
  }

  const clientEmail = String(body.client_email).trim().toLowerCase();
  const clientName = String(body.client_name).trim();
  const description = String(body.description).trim();

  if (clientName.length < 2) return json(res, 400, { success: false, error: 'Client name too short' });
  if (description.length < 10) return json(res, 400, { success: false, error: 'Description too short' });
  if (description.length > 4000) return json(res, 400, { success: false, error: 'Description too long' });

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // 1) Load artist email
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('id, email, nom_studio')
    .eq('id', body.artist_id)
    .single();

  if (artistError || !artist) return json(res, 404, { success: false, error: 'Artist not found' });

  // 2) Upsert customer by email
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert({ email: clientEmail, name: clientName }, { onConflict: 'email' })
    .select('id, email, name')
    .single();

  if (customerError || !customer) {
    return json(res, 500, { success: false, error: 'Failed to upsert customer' });
  }

  // 3) Create project as INQUIRY, deposit_paid=false
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      artist_id: body.artist_id,
      customer_id: customer.id,
      client_email: clientEmail,
      client_name: clientName,
      body_part: body.body_part,
      size_cm: body.size_cm,
      style: body.style,
      description,
      budget_max: body.budget_max ?? null,
      deposit_paid: false,
      statut: 'inquiry',
      is_cover_up: body.is_cover_up ?? false,
      is_first_tattoo: body.is_first_tattoo ?? false,
      availability: body.availability && body.availability.length > 0 ? body.availability : null,
      reference_images: body.reference_images && body.reference_images.length > 0 ? body.reference_images : null,
      ai_estimated_hours: body.ai_estimated_hours ?? null,
      ai_complexity_score: body.ai_complexity_score ?? null,
      ai_price_range: body.ai_price_range ?? null,
      ai_technical_notes: body.ai_technical_notes ?? null,
    })
    .select('id')
    .single();

  if (projectError || !project) return json(res, 500, { success: false, error: 'Failed to create project' });

  // 4) Email notify (non-blocking)
  try {
    const subject = `New project request from ${clientName}`;
    const safeStudio = escapeHtml(artist.nom_studio || 'InkFlow');
    const safeClient = escapeHtml(clientName);
    const safeEmail = escapeHtml(clientEmail);
    const safeDesc = escapeHtml(description);

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px 0;">New project request</h2>
        <p style="margin:0 0 12px 0;">
          Studio: <strong>${safeStudio}</strong><br/>
          From: <strong>${safeClient}</strong> (${safeEmail})
        </p>
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
          <div style="font-weight:700;margin-bottom:6px;">Description</div>
          <pre style="margin:0;white-space:pre-wrap;">${safeDesc}</pre>
        </div>
        <p style="margin:12px 0 0 0;color:#6b7280;font-size:12px;">
          Project ID: ${project.id}
        </p>
      </div>
    `.trim();

    const text = [
      `New project request`,
      `Studio: ${artist.nom_studio || 'InkFlow'}`,
      `From: ${clientName} (${clientEmail})`,
      '',
      `Description:`,
      description,
      '',
      `Project ID: ${project.id}`,
    ].join('\n');

    await sendResendEmail({ to: artist.email, subject, html, text, reply_to: clientEmail });
  } catch {
    // ignore email failures
  }

  return json(res, 200, { success: true, project_id: project.id });
}

