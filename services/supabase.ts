import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Client Supabase pour les opérations publiques (lecture des flashs, etc.)
// Si les variables ne sont pas définies, on crée un client avec des valeurs vides
// Cela permet à l'app de se charger même sans Supabase configuré
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

// Helper pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Helper pour obtenir le client authentifié (pour les opérations nécessitant une auth)
export const getAuthenticatedSupabase = () => {
  return supabase;
};

// Types helpers pour les requêtes
export type SupabaseClient = typeof supabase;

