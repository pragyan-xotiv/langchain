#!/usr/bin/env ts-node

/**
 * Script to run debugging SQL queries for vector search
 */

import fs from 'fs';
import path from 'path';
import supabaseClient from '../src/utils/supabase.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  try {
    // Read the SQL debug file
    const sqlPath = path.join(process.cwd(), 'supabase', 'debug-matching.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual queries
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q && !q.startsWith('--'));
    
    logger.info(`Found ${queries.length} SQL queries to run`);
    
    // Run each query
    for (const [index, query] of queries.entries()) {
      logger.info(`Running query ${index + 1}...`);
      
      // Extract a comment line above the query if it exists
      const queryLines = query.split('\n');
      const commentLine = queryLines.find(line => line.trim().startsWith('--'));
      const queryName = commentLine ? commentLine.replace('--', '').trim() : `Query ${index + 1}`;
      
      try {
        const { data, error } = await supabaseClient.rpc('run_sql_query', { sql: query });
        
        if (error) {
          logger.error(`Error running query: ${queryName}`, { error });
          continue;
        }
        
        logger.info(`Results for: ${queryName}`, { 
          rowCount: Array.isArray(data) ? data.length : 'unknown',
          sample: Array.isArray(data) && data.length > 0 ? data[0] : data
        });
        
        // Log full results for smaller result sets
        if (Array.isArray(data) && data.length > 0 && data.length <= 5) {
          data.forEach((row, i) => {
            logger.info(`Row ${i + 1}:`, row);
          });
        }
      } catch (queryError) {
        logger.error(`Exception running query: ${queryName}`, { 
          error: queryError instanceof Error ? queryError.message : String(queryError),
          query: query.substring(0, 100) + '...'
        });
      }
    }
  } catch (error) {
    logger.error('Error in debug script', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

main(); 