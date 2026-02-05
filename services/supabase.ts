import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// ============================================
// 🔍 DEBUG: Vérification des variables d'env
// ============================================
// Support Next.js (process.env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log de debug (visible dans la console du navigateur)
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.group('🔧 Supabase Configuration Debug');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? `✅ Défini (${supabaseUrl.substring(0, 30)}...)` : '❌ MANQUANT');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ Défini (${supabaseAnonKey.substring(0, 20)}...)` : '❌ MANQUANT');
  console.groupEnd();
}

// ============================================
// ⚠️ Validation des variables d'environnement
// ============================================
const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL est manquant dans .env.local');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL doit commencer par https://');
  } else if (!supabaseUrl.includes('.supabase.co')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL ne semble pas être une URL Supabase valide');
  }
  
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY est manquant dans .env.local');
  } else if (supabaseAnonKey.length < 100) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY semble trop court (clé invalide?)');
  }
  
  return { isValid: errors.length === 0, errors };
};

const { isValid, errors } = validateConfig();

if (!isValid && DEBUG_MODE) {
  console.error('🚨 Erreurs de configuration Supabase:');
  errors.forEach(err => console.error(`   • ${err}`));
  console.error('\n📝 Solution: Créez un fichier .env.local à la racine avec:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-publique');
}

// ============================================
// 🔌 Création du client Supabase
// ============================================
let supabase: SupabaseClientType<Database>;

if (isValid) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'inkflow-web',
      },
      // Intercepteur pour logger les erreurs réseau
      fetch: async (url, options) => {
        try {
          if (DEBUG_MODE) {
            console.log(`📡 Supabase Request: ${typeof url === 'string' ? url.split('?')[0] : 'URL object'}`);
          }
          
          const response = await fetch(url, options);
          
          if (!response.ok && DEBUG_MODE) {
            console.error(`❌ Supabase Response Error:`, {
              status: response.status,
              statusText: response.statusText,
              url: typeof url === 'string' ? url : 'URL object',
            });
          }
          
          return response;
        } catch (error) {
          console.error('🚨 Network Error (Failed to fetch):', {
            url: typeof url === 'string' ? url : 'URL object',
            error: error instanceof Error ? error.message : 'Unknown error',
            hint: 'Vérifiez votre connexion internet et les variables d\'environnement Supabase',
          });
          throw error;
        }
      },
    },
  });
  
  if (DEBUG_MODE) {
    console.log('✅ Client Supabase initialisé avec succès');
  }
} else {
  // Client factice pour éviter les crashs (mode développement sans Supabase)
  console.warn('⚠️ Supabase non configuré - L\'app fonctionne en mode limité');
  
  supabase = createClient<Database>(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export { supabase };

// ============================================
// 🛠️ Helpers
// ============================================

/**
 * Vérifie si Supabase est correctement configuré
 */
export const isSupabaseConfigured = (): boolean => {
  return isValid;
};

/**
 * Retourne les erreurs de configuration (pour affichage utilisateur)
 */
export const getConfigErrors = (): string[] => {
  return errors;
};

/**
 * Helper pour obtenir le client authentifié
 */
export const getAuthenticatedSupabase = () => {
  return supabase;
};

/**
 * Wrapper pour les appels Supabase avec gestion d'erreur améliorée
 */
export const safeSupabaseCall = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> => {
  if (!isValid) {
    return {
      data: null,
      error: 'Supabase n\'est pas configuré. Vérifiez vos variables d\'environnement.',
    };
  }
  
  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error('🔴 Supabase Error:', error);
      return {
        data: null,
        error: error.message || 'Une erreur est survenue',
      };
    }
    
    return { data, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    console.error('🔴 Catch Error:', errorMessage);
    
    // Détection des erreurs spécifiques
    if (errorMessage.includes('Failed to fetch')) {
      return {
        data: null,
        error: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
      };
    }
    
    return { data: null, error: errorMessage };
  }
};

// Types helpers
export type SupabaseClient = typeof supabase;
