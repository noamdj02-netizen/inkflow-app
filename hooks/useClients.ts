/**
 * Hook CRM Clients - Gestion des fiches clients avec recherche et filtres
 */

import useSWR, { type SWRConfiguration, mutate } from 'swr';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import type { Client, ClientPhoto, ClientInsert, ClientUpdate } from '../types/supabase';

const SWR_OPTIONS: SWRConfiguration = {
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  errorRetryCount: 2,
  keepPreviousData: true,
};

export type ClientWithPhotos = Client & {
  client_photos?: ClientPhoto[];
};

export type ClientFilters = {
  search?: string;
  tags?: string[];
};

async function fetchClients(
  artistId: string,
  filters?: ClientFilters
): Promise<ClientWithPhotos[]> {
  let query = supabase
    .from('clients')
    .select(`
      *,
      client_photos(*)
    `)
    .eq('artist_id', artistId)
    .order('dernier_rdv', { ascending: false, nullsFirst: false })
    .order('date_inscription', { ascending: false });

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase().replace(/[,;]/g, ' ');
    const term = `%${q}%`;
    query = query.or(
      `nom.ilike.${term},prenom.ilike.${term},email.ilike.${term},telephone.ilike.${term}`
    );
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as ClientWithPhotos[];
}

export function useClientsSWR(filters?: ClientFilters) {
  const { user } = useAuth();
  const key = user ? ['clients', user.id, filters?.search, JSON.stringify(filters?.tags)] : null;

  const { data, error, isLoading, mutate: revalidate } = useSWR<ClientWithPhotos[]>(
    key,
    () => fetchClients(user!.id, filters),
    SWR_OPTIONS
  );

  return {
    clients: data ?? [],
    loading: isLoading,
    error,
    refresh: revalidate,
  };
}

async function fetchClientById(
  artistId: string,
  clientId: string
): Promise<ClientWithPhotos | null> {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_photos(*)
    `)
    .eq('id', clientId)
    .eq('artist_id', artistId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as ClientWithPhotos;
}

export function useClientSWR(clientId: string | null) {
  const { user } = useAuth();
  const key = user && clientId ? ['client', user.id, clientId] : null;

  const { data, error, isLoading, mutate } = useSWR<ClientWithPhotos | null>(
    key,
    () => (clientId ? fetchClientById(user!.id, clientId) : Promise.resolve(null)),
    SWR_OPTIONS
  );

  return {
    client: data ?? null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

// CRUD operations
export async function createClient(
  artistId: string,
  data: Omit<ClientInsert, 'artist_id'>
): Promise<Client> {
  const { data: client, error } = await supabase
    .from('clients')
    // @ts-expect-error - Supabase builder Insert type can resolve to never with some type versions
    .insert({ ...data, artist_id: artistId })
    .select()
    .single();

  if (error) throw error;
  mutate((key) => Array.isArray(key) && key[0] === 'clients' && key[1] === artistId);
  return client as Client;
}

export async function updateClient(
  artistId: string,
  clientId: string,
  data: ClientUpdate
): Promise<Client> {
  const { data: client, error } = await supabase
    .from('clients')
    // @ts-expect-error - Supabase builder Update type can resolve to never with some type versions
    .update(data)
    .eq('id', clientId)
    .eq('artist_id', artistId)
    .select()
    .single();

  if (error) throw error;
  mutate((key) => Array.isArray(key) && (key[0] === 'clients' || key[0] === 'client') && key[1] === artistId);
  return client as Client;
}

export async function deleteClient(
  artistId: string,
  clientId: string
): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('artist_id', artistId);

  if (error) throw error;
  mutate((key) => Array.isArray(key) && (key[0] === 'clients' || key[0] === 'client') && key[1] === artistId);
}

export async function addClientPhoto(
  clientId: string,
  url: string,
  type: 'reference' | 'realisation',
  caption?: string
): Promise<ClientPhoto> {
  const { data, error } = await supabase
    .from('client_photos')
    // @ts-expect-error - Supabase builder Insert type can resolve to never with some type versions
    .insert({ client_id: clientId, url, type, caption })
    .select()
    .single();

  if (error) throw error;
  return data as ClientPhoto;
}

export async function deleteClientPhoto(photoId: string): Promise<void> {
  const { error } = await supabase
    .from('client_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}
