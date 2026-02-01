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
  return v && v.trim() ? v.trim() : null;
}

export default async function handler(req: any, res: any) {
  // Wrap everything in try-catch to handle unexpected errors
  try {
    if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method not allowed' });

    // Step 1: Rate Limiting (Anti-Spam)
    // Limit: 3 requests per IP per hour
    const clientIP = getClientIP(req);
    const rateLimitResult = rateLimit(clientIP, 3, 60 * 60 * 1000); // 3 requests per hour
    
    if (!rateLimitResult.allowed) {
      const resetSeconds = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return json(
        res,
        429,
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: resetSeconds,
        },
        {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': resetSeconds.toString(),
        }
      );
    }

    // Add rate limit headers to successful responses
    const rateLimitHeaders = {
      'X-RateLimit-Limit': '3',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
    };

    const supabaseUrl = requireEnv('SUPABASE_URL') || requireEnv('VITE_SUPABASE_URL');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing environment variables:', { 
        hasSupabaseUrl: !!supabaseUrl, 
        hasServiceKey: !!serviceKey 
      });
      return json(
        res,
        500,
        {
          success: false,
          error: 'Configuration serveur manquante. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel.',
        },
        rateLimitHeaders
      );
    }

  // Step 2: Parse request body
  let requestBody: any;
  try {
    // Handle both string and object body (Vercel can send either)
    if (typeof req.body === 'string') {
      requestBody = JSON.parse(req.body);
    } else {
      requestBody = req.body;
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    return json(
      res,
      400,
      {
        success: false,
        error: 'Invalid JSON in request body',
      },
      rateLimitHeaders
    );
  }

  // Step 3: Validate and sanitize input with Zod (prevents injection attacks)
  const validationResult = validateProjectSubmission(requestBody);
  
  if (!validationResult.success) {
    console.error('Validation failed:', validationResult.error, validationResult.details);
    return json(
      res,
      400,
      {
        success: false,
        error: validationResult.error || 'Validation failed',
        details: process.env.NODE_ENV === 'development' ? validationResult.details : undefined,
      },
      rateLimitHeaders
    );
  }

  const body = validationResult.data!; // Safe to use after validation
  const clientEmail = body.client_email; // Already lowercased and trimmed by Zod
  const clientName = body.client_name; // Already trimmed by Zod
  const description = body.description; // Already trimmed by Zod

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
    console.error('Failed to upsert customer:', customerError);
    return json(res, 500, { 
      success: false, 
      error: 'Failed to upsert customer',
      details: process.env.NODE_ENV === 'development' ? customerError?.message : undefined
    });
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

  if (projectError || !project) {
    console.error('Failed to create project:', projectError);
    return json(res, 500, { 
      success: false, 
      error: 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? projectError?.message : undefined
    });
  }

  // 4) Notifications email (robuste : retry 1x après 30s, DB "email_failed" si échec définitif, ne bloque pas la création)
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

  // Bonus : email de confirmation au client (non bloquant)
  sendAppointmentConfirmationToClient({
    clientEmail,
    clientName: clientName || 'Client',
    artistStudioName: artist.nom_studio || 'le studio',
    siteBaseUrl,
  }).catch((err) => console.error('[submit-project-request] Client confirmation email failed:', err));

  return json(
      res,
      200,
      { success: true, project_id: project.id },
      rateLimitHeaders
    );
  } catch (error: any) {
    // Catch any unexpected errors
    console.error('Unexpected error in submit-project-request:', error);
    return json(
      res,
      500,
      {
        success: false,
        error: 'Erreur serveur inattendue',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      }
    );
  }
}

