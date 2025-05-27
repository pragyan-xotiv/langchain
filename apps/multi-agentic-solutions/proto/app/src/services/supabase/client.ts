import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/environment.js';
import { logger } from '../../utils/logger.js';

// Create a singleton Supabase client
const supabaseClient = createClient(
  config.database.supabaseUrl,
  config.database.supabaseKey,
  {
    auth: {
      persistSession: false,
    },
  }
);

export default supabaseClient; 