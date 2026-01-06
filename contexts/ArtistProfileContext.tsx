import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Artist } from '../types/supabase';

interface ArtistProfileContextType {
  profile: Artist | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Artist>) => Promise<void>;
}

const ArtistProfileContext = createContext<ArtistProfileContextType | undefined>(undefined);

export const useArtistProfile = () => {
  const context = useContext(ArtistProfileContext);
  if (!context) {
    throw new Error('useArtistProfile must be used within ArtistProfileProvider');
  }
  return context;
};

interface ArtistProfileProviderProps {
  children: ReactNode;
}

export const ArtistProfileProvider: React.FC<ArtistProfileProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Vérifier si Supabase est configuré
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // Si le profil n'existe pas encore (pas encore fait l'onboarding)
        if (fetchError.code === 'PGRST116') {
          setProfile(null);
          setError(null);
        } else {
          console.error('Error fetching profile:', fetchError);
          setError(fetchError.message || 'Erreur lors du chargement du profil');
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      console.error('Error fetching artist profile:', err);
      setError(err.message || 'Erreur lors du chargement du profil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (updates: Partial<Artist>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('artists')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        setProfile(data);
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <ArtistProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </ArtistProfileContext.Provider>
  );
};

