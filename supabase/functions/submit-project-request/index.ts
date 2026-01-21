// @ts-nocheck
// Supabase Edge Function: submit-project-request
// Purpose: public "Projet Perso" submissions (bypass RLS via service role)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SubmitProjectRequestPayload = {
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
  // Optional AI fields (if provided by frontend)
  ai_estimated_hours?: number | null;
  ai_complexity_score?: number | null;
  ai_price_range?: string | null;
  ai_technical_notes?: string | null;
};

function badRequest(message: string) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendResendEmail(args: { to: string; subject: string; html: string; text: string; reply_to?: string }) {
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as SubmitProjectRequestPayload;

    if (!payload?.artist_id) return badRequest('Missing artist_id');
    if (!payload?.client_email) return badRequest('Missing client_email');
    if (!payload?.client_name) return badRequest('Missing client_name');
    if (!payload?.body_part) return badRequest('Missing body_part');
    if (!payload?.style) return badRequest('Missing style');
    if (!payload?.description) return badRequest('Missing description');

    const clientEmail = payload.client_email.trim().toLowerCase();
    const clientName = payload.client_name.trim();
    const desc = payload.description.trim();

    if (clientName.length < 2) return badRequest('Client name too short');
    if (desc.length < 10) return badRequest('Description too short');
    if (desc.length > 4000) return badRequest('Description too long');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Supabase service config' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load artist email for notification
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, email, nom_studio')
      .eq('id', payload.artist_id)
      .single();

    if (artistError || !artist) {
      return new Response(JSON.stringify({ success: false, error: 'Artist not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert customer by email
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          email: clientEmail,
          name: clientName,
        },
        { onConflict: 'email' }
      )
      .select('id, email, name')
      .single();

    if (customerError || !customer) {
      console.error('Customer upsert error:', customerError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to create customer' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert project (status INQUIRY + depositPaid false)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        artist_id: payload.artist_id,
        customer_id: customer.id,
        client_email: clientEmail,
        client_name: clientName,
        body_part: payload.body_part,
        size_cm: payload.size_cm,
        style: payload.style,
        description: desc,
        budget_max: payload.budget_max ?? null,
        deposit_paid: false,
        statut: 'inquiry',
        is_cover_up: payload.is_cover_up ?? false,
        is_first_tattoo: payload.is_first_tattoo ?? false,
        availability: payload.availability && payload.availability.length > 0 ? payload.availability : null,
        reference_images: payload.reference_images && payload.reference_images.length > 0 ? payload.reference_images : null,
        ai_estimated_hours: payload.ai_estimated_hours ?? null,
        ai_complexity_score: payload.ai_complexity_score ?? null,
        ai_price_range: payload.ai_price_range ?? null,
        ai_technical_notes: payload.ai_technical_notes ?? null,
      })
      .select('id')
      .single();

    if (projectError || !project) {
      console.error('Project insert error:', projectError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to create project' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Notify artist via Resend
    const subject = `New project request from ${clientName}`;
    const safeStudio = escapeHtml(artist.nom_studio || 'InkFlow');
    const safeClient = escapeHtml(clientName);
    const safeEmail = escapeHtml(clientEmail);
    const safeDesc = escapeHtml(desc);

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
      desc,
      '',
      `Project ID: ${project.id}`,
    ].join('\n');

    try {
      await sendResendEmail({
        to: artist.email,
        subject,
        html,
        text,
        reply_to: clientEmail,
      });
    } catch (emailErr) {
      // Non-blocking: project is saved, but email failed.
      console.error('Resend email failed:', emailErr);
    }

    return new Response(JSON.stringify({ success: true, project_id: project.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('submit-project-request error:', error);
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

