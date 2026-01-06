import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si Supabase est configuré
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      // Si Supabase n'est pas configuré, on considère qu'il n'y a pas d'utilisateur
      setUser(null);
      setLoading(false);
      return;
    }

    // Vérifier la session actuelle (persistance automatique gérée par Supabase)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // En cas d'erreur, on considère qu'il n'y a pas d'utilisateur
      setUser(null);
      setLoading(false);
    });

    // Écouter les changements d'authentification (inclut le refresh automatique)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        data: null, 
        error: { message: 'Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement.' } as any 
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'Erreur lors de l\'inscription' } as any 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        data: null, 
        error: { message: 'Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement.' } as any 
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'Erreur lors de la connexion' } as any 
      };
    }
  };

  const signOut = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: { message: 'Supabase n\'est pas configuré' } as any };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: { message: 'Erreur lors de la déconnexion' } as any };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
};

