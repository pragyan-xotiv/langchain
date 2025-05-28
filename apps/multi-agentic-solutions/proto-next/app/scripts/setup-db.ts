import { supabaseClient, isSupabaseConfigured } from '../src/lib/services/supabase/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupDatabase() {
  console.log('Starting database setup...');

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.error('Error: Supabase is not properly configured. Please check your environment variables.');
    process.exit(1);
  }

  try {
    // Create helper function for vector extension
    console.log('Creating helper functions...');
    const { error: functionError } = await supabaseClient.rpc('exec', {
      query: `
        CREATE OR REPLACE FUNCTION create_vector_extension_if_not_exists()
        RETURNS VOID AS $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_extension
            WHERE extname = 'vector'
          ) THEN
            CREATE EXTENSION vector;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (functionError) {
      throw functionError;
    }
    
    // Create vector extension if it doesn't exist
    console.log('Creating vector extension...');
    await supabaseClient.rpc('create_vector_extension_if_not_exists');

    // Create documents table
    console.log('Creating documents table...');
    const { error: documentsError } = await supabaseClient.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          metadata JSONB,
          embedding VECTOR(1536),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
      `
    });

    if (documentsError) {
      throw documentsError;
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase(); 