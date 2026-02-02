import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIP } from '../utils/rateLimit';
import { validateProjectSubmission } from '../utils/validation';
import {
  sendAppointmentNotification,
  sendAppointmentConfirmationToClient,
} from '../services/appointmentNotification';

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

function json(res: any, status: number, body: unknown, headers?: Record<string, string>) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  
  // Add custom headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
  
  res.end(JSON.stringify(body));
}

function requireEnv(name: string) {
  const v = process.env[name];
  return v && typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Parse request body: handle undefined, Buffer, string, or pre-parsed object (Vercel). */
function parseRequestBody(req: any): { ok: true; data: unknown } | { ok: false; error: string } {
  const raw = req?.body;
  if (raw === undefined || raw === null) {
    return { ok: false, error: 'Request body is missing' };
  }
  if (typeof raw === 'string') {
    if (!raw.trim()) return { ok: false, error: 'Request body is empty' };
    try {
      return { ok: true, data: JSON.parse(raw) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: `Invalid JSON: ${msg}` };
    }
  }
  if (Buffer.isBuffer(raw)) {
    try {
      const str = raw.toString('utf8');
      if (!str.trim()) return { ok: false, error: 'Request body is empty' };
      return { ok: true, data: JSON.parse(str) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: `Invalid JSON (buffer): ${msg}` };
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    return { ok: true, data: raw };
  }
  return { ok: false, error: 'Request body must be JSON' };
}

function logEnvPresence() {
  const hasSupabaseUrl = !!(requireEnv('SUPABASE_URL') || requireEnv('VITE_SUPABASE_URL'));
  const hasServiceKey = !!requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const hasResend = !!requireEnv('RESEND_API_KEY');
  console.log('[submit-project-request] Env check:', {
    hasSupabaseUrl,
    hasServiceKey,
    hasResendApiKey: hasResend,
  });
}

export default async function handler(req: any, res: any) {
  if (!req || !res) {
    console.error('[submit-project-request] Invalid handler args: req or res missing');
    return;
  }

  try {
    if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method not allowed' });

    // Step 1: Rate Limiting (Anti-Spam)
    let clientIP: string;
    try {
      clientIP = getClientIP(req);
    } catch (ipErr) {
      console.error('[submit-project-request] getClientIP failed:', ipErr);
      clientIP = 'unknown';
    }
    // Burst limit: 5 requests per minute (anti-spam)
    const burstLimit = rateLimit(`${clientIP}:1m`, 5, 60 * 1000);
    if (!burstLimit.allowed) {
      const resetSeconds = Math.ceil((burstLimit.resetAt - Date.now()) / 1000);
      return json(res, 429, {
        success: false,
        error: 'Trop de demandes. Réessayez dans quelques instants.',
      }, { 'Retry-After': resetSeconds.toString() });
    }
    // Hour limit: 3 requests per hour per IP
    const rateLimitResult = rateLimit(`${clientIP}:1h`, 3, 60 * 60 * 1000);
    if (!rateLimitResult.allowed) {
      const resetSeconds = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return json(res, 429, {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: resetSeconds,
      }, {
        'X-RateLimit-Limit': '3',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        'Retry-After': resetSeconds.toString(),
      });
    }

    const rateLimitHeaders = {
      'X-RateLimit-Limit': '3',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
    };

    logEnvPresence();

    const supabaseUrl = requireEnv('SUPABASE_URL') || requireEnv('VITE_SUPABASE_URL');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('[submit-project-request] Missing env:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!serviceKey,
      });
      return json(res, 500, { success: false, error: 'Une erreur est survenue.' }, rateLimitHeaders);
    }

    // Step 2: Parse request body (Vercel: body can be string, Buffer, or pre-parsed object)
    const parseResult = parseRequestBody(req);
    if (!parseResult.ok) {
      console.error('[submit-project-request] Body parse failed:', parseResult.error);
      return json(
        res,
        400,
        { success: false, error: parseResult.error },
        rateLimitHeaders
      );
    }
    const requestBody = parseResult.data;

    // Step 3: Validate and sanitize input with Zod (prevents injection attacks)
    const validationResult = validateProjectSubmission(requestBody);

    if (!validationResult.success) {
      console.error('[submit-project-request] Validation failed:', {
        error: validationResult.error,
        details: validationResult.details,
      });
      return json(res, 400, {
        success: false,
        error: validationResult.error || 'Données invalides.',
        ...(process.env.NODE_ENV === 'development' && { details: validationResult.details }),
      }, rateLimitHeaders);
    }

    const body = validationResult.data!;
    const clientEmail = body.client_email;
    const clientName = body.client_name;
    const description = body.description;

    try {
      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id, email, nom_studio')
        .eq('id', body.artist_id)
        .single();

      if (artistError || !artist) {
        console.error('[submit-project-request] Artist not found:', {
          artist_id: body.artist_id,
          error: artistError?.message,
          code: artistError?.code,
        });
        return json(res, 404, { success: false, error: 'Artist not found' }, rateLimitHeaders);
      }

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .upsert({ email: clientEmail, name: clientName }, { onConflict: 'email' })
        .select('id, email, name')
        .single();

      if (customerError || !customer) {
        console.error('[submit-project-request] Upsert customer failed:', {
          message: customerError?.message,
          code: customerError?.code,
          details: customerError?.details,
        });
        return json(res, 500, { success: false, error: 'Une erreur est survenue.' }, rateLimitHeaders);
      }

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

      if (projectError || !project) {
        console.error('[submit-project-request] Create project failed:', {
          message: projectError?.message,
          code: projectError?.code,
          details: projectError?.details,
        });
        return json(res, 500, { success: false, error: 'Une erreur est survenue.' }, rateLimitHeaders);
      }

      const siteBaseUrl =
        requireEnv('SITE_URL') ||
        (req.headers?.origin ? String(req.headers.origin).replace(/\/$/, '') : '') ||
        'https://inkflow.app';
      const budgetFormatted =
        body.budget_max != null ? `${Math.round(body.budget_max / 100)} €` : 'Non indiqué';

      const onEmailFailed = async (projectId: string) => {
        try {
          await supabase
            .from('projects')
            .update({ artist_notification_status: 'failed' })
            .eq('id', projectId);
        } catch (e) {
          console.error('[submit-project-request] Failed to set artist_notification_status=failed:', e);
        }
      };

      const notifResult = await sendAppointmentNotification({
        projectId: project.id,
        artistEmail: artist.email,
        artistStudioName: artist.nom_studio || undefined,
        clientName: clientName || 'Client',
        clientEmail,
        bodyPart: body.body_part,
        style: body.style,
        sizeCm: body.size_cm,
        budgetFormatted,
        description,
        siteBaseUrl,
        onEmailFailed,
      });

      if (notifResult.ok) {
        try {
          await supabase
            .from('projects')
            .update({ artist_notification_status: 'sent' })
            .eq('id', project.id);
        } catch {
          // optional: column may not exist if migration not run
        }
      }

      sendAppointmentConfirmationToClient({
        clientEmail,
        clientName: clientName || 'Client',
        artistStudioName: artist.nom_studio || 'le studio',
        siteBaseUrl,
      }).catch((err) => console.error('[submit-project-request] Client confirmation email failed:', err));

      return json(res, 200, { success: true, project_id: project.id }, rateLimitHeaders);
    } catch (dbError: unknown) {
    const err = dbError instanceof Error ? dbError : new Error(String(dbError));
    console.error('[submit-project-request] DB/notification error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    return json(res, 500, { success: false, error: 'Une erreur est survenue.' }, rateLimitHeaders);
  }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[submit-project-request] Unexpected error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    try {
      return json(res, 500, { success: false, error: 'Une erreur est survenue.' });
    } catch (sendErr) {
      console.error('[submit-project-request] Failed to send 500 response:', sendErr);
    }
  }
}

