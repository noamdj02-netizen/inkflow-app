/**
 * Vercel Serverless Function: Callback d'authentification Supabase (PKCE Flow)
 * 
 * GET /api/auth/callback
 * 
 * Cette route gère l'échange de code PKCE contre une session Supabase.
 * Utilisée par les liens de confirmation d'email et de réinitialisation de mot de passe.
 * 
 * Compatible avec Vercel Serverless Functions (Vite)
 */

import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function redirect(res: any, url: string, status: number = 302) {
  res.writeHead(status, { Location: url });
  res.end();
}

export default async function handler(req: any, res: any) {
  // Seulement GET autorisé
  if (req.method !== 'GET') {
    res.status(405).setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY') || requireEnv('SUPABASE_ANON_KEY');

    // Récupérer les paramètres de l'URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    const next = url.searchParams.get('next'); // URL de redirection personnalisée

    // Obtenir l'origine pour construire les URLs de redirection
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const baseUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || origin;

    // Gérer les erreurs Supabase
    if (error) {
      const errorMessage = errorDescription 
        ? decodeURIComponent(errorDescription) 
        : error;
      
      console.error('❌ Auth callback error:', errorMessage);
      
      const redirectUrl = new URL('/login', baseUrl);
      redirectUrl.searchParams.set('error', error);
      if (errorDescription) {
        redirectUrl.searchParams.set('error_description', errorDescription);
      }
      
      return redirect(res, redirectUrl.toString());
    }

    // Vérifier qu'un code est présent
    if (!code) {
      console.error('❌ Auth callback: No code parameter found');
      
      const redirectUrl = new URL('/login', baseUrl);
      redirectUrl.searchParams.set('error', 'missing_code');
      redirectUrl.searchParams.set('error_description', 'Le lien de confirmation est invalide ou a expiré.');
      
      return redirect(res, redirectUrl.toString());
    }

    // Créer un client Supabase pour l'échange de code
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Les cookies seront gérés côté client
      },
    });

    // Échanger le code contre une session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ Error exchanging code for session:', exchangeError);
      
      const redirectUrl = new URL('/login', baseUrl);
      redirectUrl.searchParams.set('error', exchangeError.name || 'exchange_failed');
      redirectUrl.searchParams.set('error_description', exchangeError.message);
      
      return redirect(res, redirectUrl.toString());
    }

    if (!data.session) {
      console.error('❌ Auth callback: No session returned after code exchange');
      
      const redirectUrl = new URL('/login', baseUrl);
      redirectUrl.searchParams.set('error', 'no_session');
      redirectUrl.searchParams.set('error_description', 'Impossible de créer une session. Le lien a peut-être expiré.');
      
      return redirect(res, redirectUrl.toString());
    }

    // Free Trial First : créer ou laisser l'utilisateur dans public.users avec essai 14j si nouveau
    const authUser = data.session.user;
    const userId = authUser.id;
    const email = (authUser.email || '').trim() || '';
    const name =
      (authUser.user_metadata?.full_name as string) ||
      (authUser.user_metadata?.name as string) ||
      (email ? email.split('@')[0] : '') ||
      'Utilisateur';

    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      if (serviceKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (!existing) {
          const now = new Date();
          const trialEndsAt = new Date(now);
          trialEndsAt.setDate(trialEndsAt.getDate() + 14);
          await supabaseAdmin.from('users').insert({
            id: userId,
            email: email || 'unknown@inkflow.local',
            name: name.slice(0, 255) || 'Utilisateur',
            subscription_status: 'trialing',
            subscription_plan: 'STARTER',
            trial_started_at: now.toISOString(),
            trial_ends_at: trialEndsAt.toISOString(),
          } as Record<string, unknown>);
          console.log('✅ User created in public.users with 14-day trial:', userId);
        }
      }
    } catch (dbErr: unknown) {
      console.error('⚠️ Auth callback: could not ensure user row (trial):', dbErr);
      // Ne pas bloquer la redirection : l'utilisateur pourra être créé au premier appel API (ex: stripe)
    }

    // Déterminer l'URL de redirection
    let redirectPath = '/dashboard';
    
    // Si un paramètre 'next' est fourni, l'utiliser (après validation)
    if (next) {
      try {
        const nextUrl = new URL(next, baseUrl);
        // Sécurité: ne rediriger que vers le même domaine
        if (nextUrl.origin === new URL(baseUrl).origin) {
          redirectPath = nextUrl.pathname + nextUrl.search;
        }
      } catch {
        // Si l'URL est invalide, utiliser la redirection par défaut
        console.warn('⚠️ Invalid next parameter, using default redirect');
      }
    }

    // Construire l'URL de redirection finale
    const redirectUrl = new URL(redirectPath, baseUrl);
    
    // Ajouter les tokens dans l'URL pour que le client puisse les récupérer
    // Note: En production, vous devriez utiliser des cookies HTTP-only pour plus de sécurité
    // Pour l'instant, on redirige vers la page frontend qui gérera la session
    redirectUrl.searchParams.set('session_set', 'true');

    console.log('✅ Auth callback successful, redirecting to:', redirectUrl.toString());
    
    return redirect(res, redirectUrl.toString());

  } catch (error: any) {
    console.error('🚨 Auth callback unexpected error:', error);
    
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const baseUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || origin;
    
    const redirectUrl = new URL('/login', baseUrl);
    redirectUrl.searchParams.set('error', 'unexpected_error');
    redirectUrl.searchParams.set('error_description', error?.message || 'Une erreur inattendue s\'est produite.');
    
    return redirect(res, redirectUrl.toString());
  }
}
