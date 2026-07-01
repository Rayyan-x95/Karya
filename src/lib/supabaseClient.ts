import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Warning: Supabase credentials are not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.'
  );
}

export const isMock = false;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const resetMockDb = () => {
  // No-op in production / non-mock mode
};
