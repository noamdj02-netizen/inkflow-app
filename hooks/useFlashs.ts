import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Flash } from '../types/supabase';
import type { FlashDesign } from '../types';
import { mapFlashToFlashDesign } from '../types';

/**
 * Hook pour récupérer les flashs d'un artiste depuis Supabase
 * @param artistSlug - Le slug de l'artiste (ex: "zonett_ink")
 */
export const useFlashs = (artistSlug?: string) => {
  const [flashs, setFlashs] = useState<FlashDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFlashs = async () => {
      // Vérifier si Supabase est configuré
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        // Si Supabase n'est pas configuré, on retourne un tableau vide
        setFlashs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('flashs')
          .select('*, artists!inner(slug_profil)')
          .eq('statut', 'available')
          .order('created_at', { ascending: false });

        // Si un slug est fourni, filtrer par artiste
        if (artistSlug) {
          query = query.eq('artists.slug_profil', artistSlug);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Convertir les flashs Supabase vers le format UI
        const flashsUI = (data as any[]).map((item: Flash & { artists: any }) => 
          mapFlashToFlashDesign(item)
        );

        setFlashs(flashsUI);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur lors du chargement des flashs'));
        console.error('Error fetching flashs:', err);
        setFlashs([]); // Retourner un tableau vide en cas d'erreur
      } finally {
        setLoading(false);
      }
    };

    fetchFlashs();

    // Abonnement aux changements en temps réel
    const subscription = supabase
      .channel('flashs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flashs',
        },
        () => {
          // Recharger les flashs en cas de changement
          fetchFlashs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [artistSlug]);

  return { flashs, loading, error };
};

/**
 * Hook pour récupérer les flashs d'un artiste spécifique par son ID
 */
export const useFlashsByArtistId = (artistId: string) => {
  const [flashs, setFlashs] = useState<FlashDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFlashs = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('flashs')
          .select('*')
          .eq('artist_id', artistId)
          .eq('statut', 'available')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const flashsUI = (data || []).map(mapFlashToFlashDesign);
        setFlashs(flashsUI);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur lors du chargement des flashs'));
        console.error('Error fetching flashs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      fetchFlashs();
    }
  }, [artistId]);

  return { flashs, loading, error };
};

