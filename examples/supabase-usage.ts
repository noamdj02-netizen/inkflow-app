/**
 * Exemples d'utilisation du client Supabase pour InkFlow
 * 
 * Ce fichier montre comment utiliser Supabase pour :
 * - Lire les flashs
 * - Créer des projets
 * - Gérer les réservations
 */

import { supabase } from '../services/supabase';
import type { FlashInsert, ProjectInsert, BookingInsert } from '../types/supabase';

// ============================================
// EXEMPLE 1: Récupérer les flashs disponibles
// ============================================
export const fetchAvailableFlashs = async (artistSlug: string) => {
  const { data, error } = await supabase
    .from('flashs')
    .select(`
      *,
      artists!inner(slug_profil, nom_studio)
    `)
    .eq('artists.slug_profil', artistSlug)
    .eq('statut', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching flashs:', error);
    return [];
  }

  return data;
};

// ============================================
// EXEMPLE 2: Créer un nouveau flash
// ============================================
export const createFlash = async (flashData: FlashInsert) => {
  const { data, error } = await supabase
    .from('flashs')
    .insert(flashData)
    .select()
    .single();

  if (error) {
    console.error('Error creating flash:', error);
    throw error;
  }

  return data;
};

// ============================================
// EXEMPLE 3: Créer une demande de projet
// ============================================
export const createProject = async (projectData: ProjectInsert) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  return data;
};

// ============================================
// EXEMPLE 4: Mettre à jour le statut d'un projet
// ============================================
export const updateProjectStatus = async (
  projectId: string,
  status: 'pending' | 'approved' | 'rejected' | 'quoted',
  artistQuotedPrice?: number,
  artistNotes?: string
) => {
  const { data, error } = await supabase
    .from('projects')
    .update({
      statut: status,
      artist_quoted_price: artistQuotedPrice ? artistQuotedPrice * 100 : null, // Conversion euros -> centimes
      artist_notes: artistNotes,
      artist_response_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data;
};

// ============================================
// EXEMPLE 5: Créer une réservation
// ============================================
export const createBooking = async (bookingData: BookingInsert) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return data;
};

// ============================================
// EXEMPLE 6: Récupérer les réservations d'un artiste
// ============================================
export const fetchArtistBookings = async (
  artistId: string,
  startDate?: string,
  endDate?: string
) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      flashs(title, image_url),
      projects(body_part, style)
    `)
    .eq('artist_id', artistId)
    .order('date_debut', { ascending: true });

  if (startDate) {
    query = query.gte('date_debut', startDate);
  }

  if (endDate) {
    query = query.lte('date_debut', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return data;
};

// ============================================
// EXEMPLE 7: Mettre à jour le statut de paiement
// ============================================
export const updatePaymentStatus = async (
  bookingId: string,
  status: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'failed',
  stripePaymentIntentId?: string
) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      statut_paiement: status,
      stripe_payment_intent_id: stripePaymentIntentId || null,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }

  return data;
};

// ============================================
// EXEMPLE 8: Écouter les changements en temps réel
// ============================================
export const subscribeToFlashsChanges = (
  artistId: string,
  callback: (flash: any) => void
) => {
  const subscription = supabase
    .channel(`flashs-${artistId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'flashs',
        filter: `artist_id=eq.${artistId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// ============================================
// EXEMPLE 9: Récupérer un artiste par son slug
// ============================================
export const fetchArtistBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('slug_profil', slug)
    .single();

  if (error) {
    console.error('Error fetching artist:', error);
    throw error;
  }

  return data;
};

// ============================================
// EXEMPLE 10: Vérifier les créneaux disponibles
// ============================================
export const checkAvailableSlots = async (
  artistId: string,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_artist_id: artistId,
    p_date_debut: startDate,
    p_date_fin: endDate,
  });

  if (error) {
    console.error('Error checking available slots:', error);
    throw error;
  }

  return data;
};

