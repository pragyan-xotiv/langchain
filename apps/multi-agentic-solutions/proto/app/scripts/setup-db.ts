import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from '../src/utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_KEY in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    logger.info('Starting database setup...');

    // Create tables (RLS will be configured in Supabase dashboard)
    
    // User queries table
    const { error: queryError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'user_queries',
      columns: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        text TEXT NOT NULL,
        user_id UUID NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB
      `
    });
    
    if (queryError) throw queryError;
    logger.info('Created user_queries table');

    // Agent responses table
    const { error: responseError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'agent_responses',
      columns: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        query_id UUID NOT NULL REFERENCES user_queries(id),
        agent_id VARCHAR NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB
      `
    });
    
    if (responseError) throw responseError;
    logger.info('Created agent_responses table');

    // Documents table
    const { error: docsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'documents',
      columns: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content TEXT NOT NULL,
        metadata JSONB NOT NULL,
        embedding VECTOR(1536)
      `
    });
    
    if (docsError) throw docsError;
    logger.info('Created documents table');

    // Enable vector extension
    const { error: vectorError } = await supabase.rpc('enable_extension', {
      extension_name: 'vector'
    });
    
    if (vectorError && !vectorError.message.includes('already exists')) throw vectorError;
    logger.info('Enabled vector extension');

    // Create vector index
    const { error: indexError } = await supabase.rpc('create_index_if_not_exists', {
      index_name: 'documents_embedding_idx',
      table_name: 'documents',
      index_definition: 'USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)'
    });
    
    if (indexError && !indexError.message.includes('already exists')) throw indexError;
    logger.info('Created vector index');

    logger.info('Database setup completed successfully');
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Database setup failed', { message: error.message, stack: error.stack });
    } else {
      logger.error('Database setup failed with unknown error');
    }
    process.exit(1);
  }
}

setupDatabase(); 