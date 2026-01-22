// Types générés pour Supabase Database
// Ces types correspondent au schéma SQL défini dans supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          email: string
          nom_studio: string
          slug_profil: string
          stripe_account_id: string | null
          stripe_connected: boolean
          stripe_onboarding_complete: boolean
          deposit_percentage: number
          accent_color: string
          theme_color: 'amber' | 'red' | 'blue' | 'emerald' | 'violet' | null
          theme_accent_hex: string | null
          theme_secondary_hex: string | null
          avatar_url: string | null
          bio_instagram: string | null
          pre_tattoo_instructions: string | null
          user_plan: 'FREE' | 'STARTER' | 'PRO' | 'STUDIO' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nom_studio: string
          slug_profil: string
          stripe_account_id?: string | null
          stripe_connected?: boolean
          stripe_onboarding_complete?: boolean
          deposit_percentage?: number
          accent_color?: string
          theme_color?: 'amber' | 'red' | 'blue' | 'emerald' | 'violet'
          theme_accent_hex?: string | null
          theme_secondary_hex?: string | null
          avatar_url?: string | null
          bio_instagram?: string | null
          pre_tattoo_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nom_studio?: string
          slug_profil?: string
          stripe_account_id?: string | null
          stripe_connected?: boolean
          stripe_onboarding_complete?: boolean
          deposit_percentage?: number
          accent_color?: string
          theme_color?: 'amber' | 'red' | 'blue' | 'emerald' | 'violet'
          theme_accent_hex?: string | null
          theme_secondary_hex?: string | null
          avatar_url?: string | null
          bio_instagram?: string | null
          pre_tattoo_instructions?: string | null
          user_plan?: 'FREE' | 'STARTER' | 'PRO' | 'STUDIO'
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      flashs: {
        Row: {
          id: string
          artist_id: string
          title: string
          image_url: string
          prix: number // En centimes
          deposit_amount: number | null // Montant de l'acompte en centimes (optionnel, calculé depuis prix * deposit_percentage si NULL)
          duree_minutes: number
          taille_cm: string | null
          style: string | null
          statut: 'available' | 'reserved' | 'sold_out'
          stock_limit: number
          stock_current: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          title: string
          image_url: string
          prix: number
          deposit_amount?: number | null
          duree_minutes: number
          taille_cm?: string | null
          style?: string | null
          statut?: 'available' | 'reserved' | 'sold_out'
          stock_limit?: number
          stock_current?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          title?: string
          image_url?: string
          prix?: number
          duree_minutes?: number
          taille_cm?: string | null
          style?: string | null
          statut?: 'available' | 'reserved' | 'sold_out'
          stock_limit?: number
          stock_current?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          artist_id: string
          customer_id: string | null
          client_email: string
          client_name: string | null
          body_part: string
          size_cm: number
          style: string
          description: string
          budget_max: number | null // En centimes
          deposit_paid: boolean
          is_cover_up: boolean
          is_first_tattoo: boolean
          reference_images: string[] | null
          availability: string[] | null
          ai_estimated_hours: number | null
          ai_complexity_score: number | null
          ai_price_range: string | null
          ai_technical_notes: string | null
          statut: 'pending' | 'inquiry' | 'approved' | 'rejected' | 'quoted'
          artist_quoted_price: number | null // En centimes
          artist_notes: string | null
          artist_response_at: string | null
          care_template_id: string | null
          custom_care_instructions: string | null
          care_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          customer_id?: string | null
          client_email: string
          client_name?: string | null
          body_part: string
          size_cm: number
          style: string
          description: string
          budget_max?: number | null
          deposit_paid?: boolean
          is_cover_up?: boolean
          is_first_tattoo?: boolean
          reference_images?: string[] | null
          availability?: string[] | null
          ai_estimated_hours?: number | null
          ai_complexity_score?: number | null
          ai_price_range?: string | null
          ai_technical_notes?: string | null
          statut?: 'pending' | 'inquiry' | 'approved' | 'rejected' | 'quoted'
          artist_quoted_price?: number | null
          artist_notes?: string | null
          artist_response_at?: string | null
          care_template_id?: string | null
          custom_care_instructions?: string | null
          care_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          customer_id?: string | null
          client_email?: string
          client_name?: string | null
          body_part?: string
          size_cm?: number
          style?: string
          description?: string
          budget_max?: number | null
          deposit_paid?: boolean
          is_cover_up?: boolean
          is_first_tattoo?: boolean
          reference_images?: string[] | null
          availability?: string[] | null
          ai_estimated_hours?: number | null
          ai_complexity_score?: number | null
          ai_price_range?: string | null
          ai_technical_notes?: string | null
          statut?: 'pending' | 'inquiry' | 'approved' | 'rejected' | 'quoted'
          artist_quoted_price?: number | null
          artist_notes?: string | null
          artist_response_at?: string | null
          care_template_id?: string | null
          custom_care_instructions?: string | null
          care_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      care_templates: {
        Row: {
          id: string
          artist_id: string
          title: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          title: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          artist_id: string
          flash_id: string | null
          project_id: string | null
          client_email: string
          client_name: string | null
          client_phone: string | null
          date_debut: string
          date_fin: string
          duree_minutes: number
          prix_total: number // En centimes
          deposit_amount: number // En centimes
          deposit_percentage: number
          statut_paiement: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'failed'
          stripe_payment_intent_id: string | null
          stripe_deposit_intent_id: string | null
          statut_booking: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled' | 'no_show'
          reminder_sent_at: string | null
          reminder_sms_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          flash_id?: string | null
          project_id?: string | null
          client_email: string
          client_name?: string | null
          client_phone?: string | null
          date_debut: string
          date_fin: string
          duree_minutes: number
          prix_total: number
          deposit_amount: number
          deposit_percentage: number
          statut_paiement?: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'failed'
          stripe_payment_intent_id?: string | null
          stripe_deposit_intent_id?: string | null
          statut_booking?: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          reminder_sent_at?: string | null
          reminder_sms_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          flash_id?: string | null
          project_id?: string | null
          client_email?: string
          client_name?: string | null
          client_phone?: string | null
          date_debut?: string
          date_fin?: string
          duree_minutes?: number
          prix_total?: number
          deposit_amount?: number
          deposit_percentage?: number
          statut_paiement?: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'failed'
          stripe_payment_intent_id?: string | null
          stripe_deposit_intent_id?: string | null
          statut_booking?: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          reminder_sent_at?: string | null
          reminder_sms_sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      stripe_transactions: {
        Row: {
          id: string
          booking_id: string | null
          artist_id: string
          stripe_payment_intent_id: string
          amount: number // En centimes
          currency: string
          status: string
          payment_type: 'deposit' | 'full_payment'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          artist_id: string
          stripe_payment_intent_id: string
          amount: number
          currency?: string
          status: string
          payment_type: 'deposit' | 'full_payment'
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          artist_id?: string
          stripe_payment_intent_id?: string
          amount?: number
          currency?: string
          status?: string
          payment_type?: 'deposit' | 'full_payment'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_slots: {
        Args: {
          p_artist_id: string
          p_date_debut: string
          p_date_fin: string
        }
        Returns: {
          date_debut: string
          date_fin: string
          is_available: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Types helpers pour faciliter l'utilisation
export type Artist = Database['public']['Tables']['artists']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Flash = Database['public']['Tables']['flashs']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type StripeTransaction = Database['public']['Tables']['stripe_transactions']['Row']

export type ArtistInsert = Database['public']['Tables']['artists']['Insert']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type FlashInsert = Database['public']['Tables']['flashs']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']

export type ArtistUpdate = Database['public']['Tables']['artists']['Update']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']
export type FlashUpdate = Database['public']['Tables']['flashs']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

