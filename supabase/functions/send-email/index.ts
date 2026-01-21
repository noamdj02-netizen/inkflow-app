// @ts-nocheck
// Supabase Edge Function: send-email (Resend)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SendEmailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
  from?: string;
};

async function sendWithResend(payload: SendEmailPayload) {
  const apiKey = Deno.env.get('RESEND_API_KEY') || '';
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');

  const from = payload.from || Deno.env.get('RESEND_FROM_EMAIL') || 'InkFlow <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.reply_to,
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as SendEmailPayload;
    if (!body?.to || !body?.subject || (!body.html && !body.text)) {
      return new Response(JSON.stringify({ error: 'Missing required fields (to, subject, html|text)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await sendWithResend(body);
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('send-email error:', error);
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

