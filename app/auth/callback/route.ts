/**
 * API Route: Callback d'authentification Supabase (PKCE Flow)
 * 
 * GET /auth/callback
 * 
 * Cette route gère l'échange de code PKCE contre une session Supabase.
 * Utilisée par les liens de confirmation d'email et de réinitialisation de mot de passe.
 * 
 * Compatible Next.js 14/15 App Router
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * GET Handler: Échange le code PKCE contre une session et redirige l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY') || requireEnv('SUPABASE_ANON_KEY');

    // Récupérer les paramètres de l'URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const next = searchParams.get('next'); // URL de redirection personnalisée

    // Gérer les erreurs Supabase
    if (error) {
      const errorMessage = errorDescription 
        ? decodeURIComponent(errorDescription) 
        : error;
      
      console.error('❌ Auth callback error:', errorMessage);
      
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', error);
      if (errorDescription) {
        redirectUrl.searchParams.set('error_description', errorDescription);
      }
      
      return NextResponse.redirect(redirectUrl);
    }

    // Vérifier qu'un code est présent
    if (!code) {
      console.error('❌ Auth callback: No code parameter found');
      
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'missing_code');
      redirectUrl.searchParams.set('error_description', 'Le lien de confirmation est invalide ou a expiré.');
      
      return NextResponse.redirect(redirectUrl);
    }

    // Créer un client Supabase SSR pour gérer les cookies correctement
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Les cookies peuvent être set uniquement dans un Server Component ou Route Handler
              // Si on est dans un middleware, on ignore l'erreur
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Ignore si on ne peut pas supprimer le cookie
            }
          },
        },
      }
    );

    // Échanger le code contre une session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ Error exchanging code for session:', exchangeError);
      
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', exchangeError.name || 'exchange_failed');
      redirectUrl.searchParams.set('error_description', exchangeError.message);
      
      return NextResponse.redirect(redirectUrl);
    }

    if (!data.session) {
      console.error('❌ Auth callback: No session returned after code exchange');
      
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'no_session');
      redirectUrl.searchParams.set('error_description', 'Impossible de créer une session. Le lien a peut-être expiré.');
      
      return NextResponse.redirect(redirectUrl);
    }

    // Déterminer l'URL de redirection
    let redirectPath = '/dashboard';
    
    // Si un paramètre 'next' est fourni, l'utiliser (après validation)
    if (next) {
      try {
        const nextUrl = new URL(next, request.url);
        // Sécurité: ne rediriger que vers le même domaine
        if (nextUrl.origin === new URL(request.url).origin) {
          redirectPath = nextUrl.pathname + nextUrl.search;
        }
      } catch {
        // Si l'URL est invalide, utiliser la redirection par défaut
        console.warn('⚠️ Invalid next parameter, using default redirect');
      }
    }

    // Créer la réponse de redirection
    const redirectUrl = new URL(redirectPath, request.url);
    
    // Créer une réponse avec les cookies de session
    // Les cookies sont automatiquement gérés par createServerClient via les callbacks
    const response = NextResponse.redirect(redirectUrl);

    console.log('✅ Auth callback successful, redirecting to:', redirectPath);
    console.log('✅ Session created for user:', data.session.user.email);
    
    return response;

  } catch (error: any) {
    console.error('🚨 Auth callback unexpected error:', error);
    
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'unexpected_error');
    redirectUrl.searchParams.set('error_description', error?.message || 'Une erreur inattendue s\'est produite.');
    
    return NextResponse.redirect(redirectUrl);
  }
}
