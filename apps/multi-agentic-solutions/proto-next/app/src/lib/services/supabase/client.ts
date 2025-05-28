import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error('SUPABASE_URL environment variable is not set');
}

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_KEY environment variable is not set');
}

// Initialize Supabase client
export const supabaseClient = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      persistSession: false,
    },
  }
);

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey);
} 