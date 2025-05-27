import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js';
import { logger } from './logger.js';

// Create Supabase client
export const supabaseClient = createClient(
  config.database.supabaseUrl,
  config.database.supabaseKey
);

// Log connection status
supabaseClient.auth.onAuthStateChange((event) => {
  logger.info('Supabase auth state change', { event });
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): never => {
  logger.error('Supabase error', { error });
  throw error;
};

export default supabaseClient; 