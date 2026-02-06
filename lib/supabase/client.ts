import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Your project\'s URL and Key are required to create a Supabase client!\n\n' +
      'Check your Supabase project\'s API settings to find these values:\n' +
      'https://supabase.com/dashboard/project/_/settings/api\n\n' +
      'Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
