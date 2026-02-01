/**
 * Données vitrine publique par slug : artiste + flashs.
 * SWR avec revalidation 3600s (ISR-like), prefetch possible.
 */

import useSWR, { type SWRConfiguration, mutate } from 'swr';
import { supabase } from '../services/supabase';
import type { Artist, Flash } from '../types/supabase';

export type ArtistVitrine = Artist & {
  ville?: string | null;
  rating?: number | null;
  nb_avis?: number | null;
  years_experience?: number | null;
  vitrine_show_glow?: boolean | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
};

export type PublicArtistData = {
  artist: ArtistVitrine;
  flashs: Flash[];
};

const REVALIDATE_SEC = 3600;
const swrOptions: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  revalidateIfStale: true,
};

async function fetchPublicArtist(slug: string): Promise<PublicArtistData> {
  const { data: artistData, error: artistError } = await supabase
    .from('artists')
    .select('*')
    .eq('slug_profil', slug)
    .single();

  if (artistError || !artistData) {
    if (artistError?.code === 'PGRST116') throw new Error('ARTIST_NOT_FOUND');
    throw new Error(artistError?.message || 'Artiste non trouvé');
  }

  const artist = artistData as ArtistVitrine;

  const { data: flashsData, error: flashsError } = await supabase
    .from('flashs')
    .select('*')
    .eq('artist_id', artist.id)
    .eq('statut', 'available')
    .order('created_at', { ascending: false });

  if (flashsError) {
    return { artist, flashs: [] };
  }

  return {
    artist,
    flashs: (flashsData || []) as Flash[],
  };
}

export function usePublicArtist(slug: string | undefined) {
  const key = slug ? ['public-artist', slug] : null;
  const { data, error, isLoading, mutate: revalidate } = useSWR<PublicArtistData>(
    key,
    () => fetchPublicArtist(slug!),
    {
      ...swrOptions,
      revalidateOnMount: true,
      refreshInterval: REVALIDATE_SEC * 1000,
    }
  );

  return {
    artist: data?.artist ?? null,
    flashs: data?.flashs ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    notFound: error?.message === 'ARTIST_NOT_FOUND',
    refresh: revalidate,
  };
}

export function prefetchPublicArtist(slug: string) {
  return mutate(['public-artist', slug], () => fetchPublicArtist(slug));
}
