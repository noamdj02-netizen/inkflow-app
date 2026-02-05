import { supabase } from './supabase';

interface CreateCheckoutSessionParams {
  amount: number; // En centimes
  flash_title: string;
  client_email: string;
  client_name: string;
  booking_id: string;
  artist_id: string;
  success_url?: string;
  cancel_url?: string;
}

export const createCheckoutSession = async (params: CreateCheckoutSessionParams) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase n\'est pas configuré');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      amount: params.amount,
      flash_title: params.flash_title,
      client_email: params.client_email,
      client_name: params.client_name,
      booking_id: params.booking_id,
      artist_id: params.artist_id,
      success_url: params.success_url || `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancel_url || `${window.location.origin}/payment/cancel`,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('URL de paiement non reçue');

  return data;
};
