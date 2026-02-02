/**
 * URIs de redirection OAuth pour vérification (Google / Supabase).
 * Utilisez ces valeurs exactes dans Google Cloud Console et Supabase Dashboard
 * pour éviter l'erreur "redirect_uri_mismatch" (Error 400).
 */

const supabaseUrl = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_SUPABASE_URL || ''
  : '';

const siteUrl = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_SITE_URL || ''
  : '';

/** URL de callback Supabase (c'est celle que Google doit autoriser). */
export function getSupabaseCallbackUri(): string {
  if (!supabaseUrl) return '';
  const base = supabaseUrl.replace(/\/$/, '');
  return `${base}/auth/v1/callback`;
}

/** URL de callback de l'app (où Supabase redirige après auth). */
export function getAppCallbackUri(origin?: string): string {
  const base = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '') || 'https://ink-flow.me';
  const clean = base.replace(/\/$/, '');
  return `${clean}/auth/callback`;
}

/**
 * Liste des URIs à ajouter dans Google Cloud Console → Credentials → OAuth 2.0 Client
 * → Authorized redirect URIs (exactement, sans slash final).
 */
export function getGoogleRedirectUrisToAllow(): string[] {
  const supabaseCallback = getSupabaseCallbackUri();
  const uris: string[] = [];
  if (supabaseCallback) uris.push(supabaseCallback);
  // Prod
  uris.push('https://ink-flow.me/auth/callback');
  // Dev / preview
  uris.push('http://localhost:5173/auth/callback');
  uris.push('https://inkflow-app-swart.vercel.app/auth/callback');
  return [...new Set(uris)];
}

/**
 * Liste des Redirect URLs à ajouter dans Supabase Dashboard
 * → Authentication → URL Configuration → Redirect URLs.
 */
export function getSupabaseRedirectUrlsToAllow(): string[] {
  return [
    'https://ink-flow.me/auth/callback',
    'http://localhost:5173/auth/callback',
    'https://inkflow-app-swart.vercel.app/auth/callback',
  ];
}
