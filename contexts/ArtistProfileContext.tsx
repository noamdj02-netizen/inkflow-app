import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Artist } from '../types/supabase';

// ─── Types ─────────────────────────────────────────────────────────
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'retrying';

interface UpdateResult {
  success: boolean;
  data?: Artist;
  error?: string;
}

interface ArtistProfileContextType {
  profile: Artist | null;
  loading: boolean;
  error: string | null;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Artist>) => Promise<UpdateResult>;
  updateProfileOptimistic: (updates: Partial<Artist>) => Promise<UpdateResult>;
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

// ─── Constants ─────────────────────────────────────────────────────
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;
const SAVE_STATUS_RESET_MS = 3000;

export const ArtistProfileProvider: React.FC<ArtistProfileProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ─── Helpers ───────────────────────────────────────────────────────
  const resetSaveStatusAfterDelay = useCallback(() => {
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, SAVE_STATUS_RESET_MS);
  }, []);

  // ─── Fetch profile ─────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

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
        .maybeSingle();

      if (fetchError) {
        if (fetchError.code === 'PGRST116' || fetchError.code === '42501') {
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
  }, [user]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // ─── Core update with retry ────────────────────────────────────────
  const executeUpdate = useCallback(async (
    updates: Partial<Artist>,
    attempt: number = 0,
  ): Promise<UpdateResult> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('artists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée après la mise à jour');
      }

      // ── Verify coherence: re-fetch and compare key fields ──
      const { data: verifyData } = await supabase
        .from('artists')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (verifyData) {
        // Check that the critical fields we updated are actually persisted
        const keysToCheck = Object.keys(updates) as (keyof Artist)[];
        const mismatch = keysToCheck.some((key) => {
          if (key === 'updated_at') return false;
          return JSON.stringify(verifyData[key]) !== JSON.stringify(updates[key]);
        });

        if (mismatch && attempt < MAX_RETRIES) {
          console.warn(`[Profile] Coherence mismatch detected, retry ${attempt + 1}/${MAX_RETRIES}`);
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          return executeUpdate(updates, attempt + 1);
        }

        setProfile(verifyData);
        return { success: true, data: verifyData };
      }

      setProfile(data);
      return { success: true, data };
    } catch (err: any) {
      // Retry on transient errors
      if (attempt < MAX_RETRIES) {
        const isTransient =
          err?.message?.includes('Failed to fetch') ||
          err?.message?.includes('network') ||
          err?.code === 'PGRST301' ||
          err?.code === '40001'; // serialization failure

        if (isTransient) {
          console.warn(`[Profile] Transient error, retry ${attempt + 1}/${MAX_RETRIES}:`, err.message);
          setSaveStatus('retrying');
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          return executeUpdate(updates, attempt + 1);
        }
      }

      console.error('Error updating profile:', err);
      return {
        success: false,
        error: err?.message || 'Erreur lors de la mise à jour du profil',
      };
    }
  }, [user]);

  // ─── Standard update (non-optimistic) ──────────────────────────────
  const updateProfile = useCallback(async (updates: Partial<Artist>): Promise<UpdateResult> => {
    setSaveStatus('saving');
    setError(null);

    const result = await executeUpdate(updates);

    if (result.success) {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      resetSaveStatusAfterDelay();
    } else {
      setSaveStatus('error');
      setError(result.error || 'Erreur inconnue');
      resetSaveStatusAfterDelay();
    }

    return result;
  }, [executeUpdate, resetSaveStatusAfterDelay]);

  // ─── Optimistic update ─────────────────────────────────────────────
  const updateProfileOptimistic = useCallback(async (updates: Partial<Artist>): Promise<UpdateResult> => {
    const previousProfile = profile;

    // Optimistic: apply immediately to UI
    if (profile) {
      setProfile({ ...profile, ...updates });
    }

    setSaveStatus('saving');
    setError(null);

    const result = await executeUpdate(updates);

    if (result.success) {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      resetSaveStatusAfterDelay();
    } else {
      // Rollback on failure
      setProfile(previousProfile);
      setSaveStatus('error');
      setError(result.error || 'Erreur inconnue');
      resetSaveStatusAfterDelay();
    }

    return result;
  }, [profile, executeUpdate, resetSaveStatusAfterDelay]);

  // ─── Lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  return (
    <ArtistProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        saveStatus,
        lastSavedAt,
        refreshProfile,
        updateProfile,
        updateProfileOptimistic,
      }}
    >
      {children}
    </ArtistProfileContext.Provider>
  );
};
