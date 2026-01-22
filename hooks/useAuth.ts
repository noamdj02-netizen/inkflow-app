import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, getConfigErrors } from '../services/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Debug mode (only in development)
const DEBUG_MODE = import.meta.env.DEV || false;

// ============================================
// 🔄 Cache de session (module-level)
// ============================================
interface SessionCache {
  session: Session | null;
  timestamp: number;
}

const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let sessionCache: SessionCache | null = null;
let isCheckingSession = false;

// ============================================
// 🔐 Hook d'authentification
// ============================================
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    // Si Supabase n'est pas configuré, on arrête là
    if (!isSupabaseConfigured()) {
      const errors = getConfigErrors();
      console.warn('⚠️ useAuth: Supabase non configuré', errors);
      setAuthError(errors.join('. '));
      setUser(null);
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        // Vérifier le cache de session d'abord
        const now = Date.now();
        if (sessionCache && (now - sessionCache.timestamp) < SESSION_CACHE_DURATION) {
          console.log('🔄 useAuth: Utilisation du cache de session');
          setUser(sessionCache.session?.user ?? null);
          setLoading(false);
          return;
        }

        // Cache expiré ou inexistant, vérifier la session
        if (!isCheckingSession) {
          isCheckingSession = true;
          console.log('🔄 useAuth: Vérification de la session...');
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ useAuth: Erreur getSession:', error.message);
            setAuthError(error.message);
            sessionCache = null;
            setUser(null);
          } else {
            console.log('✅ useAuth: Session récupérée', session ? 'avec utilisateur' : 'sans utilisateur');
            sessionCache = {
              session,
              timestamp: Date.now(),
            };
            setUser(session?.user ?? null);
            setAuthError(null);
          }
          
          setLoading(false);
          isCheckingSession = false;
        }
      } catch (err) {
        console.error('🚨 useAuth: Erreur critique:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        
        // Détection "Failed to fetch"
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          setAuthError('Impossible de se connecter au serveur. Vérifiez votre connexion internet et les variables d\'environnement Supabase.');
        } else {
          setAuthError(errorMessage);
        }
        
        sessionCache = null;
        setUser(null);
        setLoading(false);
        isCheckingSession = false;
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sessionCache = {
        session,
        timestamp: Date.now(),
      };
      setUser(session?.user ?? null);
      setLoading(false);
      setAuthError(null);
    });

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // ============================================
  // 📝 Inscription
  // ============================================
  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: { message: 'Supabase n\'est pas configuré. ' + getConfigErrors().join('. ') } as any 
      };
    }

    try {
      console.log('📝 useAuth: Tentative d\'inscription pour:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ useAuth: Erreur inscription:', error.message);
        return { data: null, error };
      }
      
      console.log('✅ useAuth: Inscription réussie');
      
      if (data?.session) {
        sessionCache = {
          session: data.session,
          timestamp: Date.now(),
        };
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('🚨 useAuth: Erreur critique inscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      
      if (errorMessage.includes('Failed to fetch')) {
        return { 
          data: null, 
          error: { message: 'Impossible de se connecter au serveur. Vérifiez votre connexion.' } as any 
        };
      }
      
      return { data: null, error: { message: errorMessage } as any };
    }
  };

  // ============================================
  // 🔑 Connexion
  // ============================================
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: { message: 'Supabase n\'est pas configuré. ' + getConfigErrors().join('. ') } as any 
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ useAuth: Erreur connexion:', error.message);
        return { data: null, error };
      }
      
      if (data?.session) {
        sessionCache = {
          session: data.session,
          timestamp: Date.now(),
        };
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('🚨 useAuth: Erreur critique connexion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la connexion';
      
      if (errorMessage.includes('Failed to fetch')) {
        return { 
          data: null, 
          error: { message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.' } as any 
        };
      }
      
      return { data: null, error: { message: errorMessage } as any };
    }
  };

  // ============================================
  // 🔐 Connexion OAuth (Google, Apple, etc.)
  // ============================================
  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: { message: 'Supabase n\'est pas configuré. ' + getConfigErrors().join('. ') } as any 
      };
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error(`❌ useAuth: Erreur OAuth ${provider}:`, error.message);
        return { data: null, error };
      }
      
      // Note: Supabase redirige automatiquement vers le provider OAuth
      // puis vers /auth/callback après authentification
      return { data, error: null };
    } catch (err) {
      console.error(`🚨 useAuth: Erreur critique OAuth ${provider}:`, err);
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la connexion avec ${provider}`;
      
      if (errorMessage.includes('Failed to fetch')) {
        return { 
          data: null, 
          error: { message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.' } as any 
        };
      }
      
      return { data: null, error: { message: errorMessage } as any };
    }
  };

  // ============================================
  // 🚪 Déconnexion
  // ============================================
  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase n\'est pas configuré' } as any };
    }

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ useAuth: Erreur déconnexion:', error.message);
        return { error };
      }
      
      sessionCache = null;
      return { error: null };
    } catch (err) {
      console.error('🚨 useAuth: Erreur critique déconnexion:', err);
      return { error: { message: 'Erreur lors de la déconnexion' } as any };
    }
  };

  return {
    user,
    loading,
    authError, // Nouvelle propriété pour afficher les erreurs
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    isAuthenticated: !!user,
    isConfigured: isSupabaseConfigured(),
  };
};
