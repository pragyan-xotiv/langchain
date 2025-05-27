#!/usr/bin/env ts-node

/**
 * Debug script to check embeddings in the database
 * 
 * Usage: ts-node examples/debug-embeddings.ts
 */

import supabaseClient from '../src/utils/supabase.js';
import { logger } from '../src/utils/logger.js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from '../src/config/environment.js';

async function main() {
  try {
    // Check if we have any documents
    const { data: documents, error: docError } = await supabaseClient
      .from('documents')
      .select('id, content')
      .limit(5);

    if (docError) {
      logger.error('Error fetching documents', { error: docError });
      return;
    }

    logger.info('Documents in database:', { count: documents.length });
    documents.forEach((doc, i) => {
      logger.info(`Document ${i + 1}:`, {
        id: doc.id,
        content: doc.content.substring(0, 50) + '...'
      });
    });

    // Check if we have any embeddings
    const { data: embeddingsData, error: embError } = await supabaseClient
      .from('embeddings')
      .select('id, document_id, embedding')
      .limit(5);

    if (embError) {
      logger.error('Error fetching embeddings', { error: embError });
      return;
    }

    logger.info('Embeddings in database:', { count: embeddingsData.length });
    embeddingsData.forEach((emb, i) => {
      logger.info(`Embedding ${i + 1}:`, {
        id: emb.id,
        document_id: emb.document_id,
        embedding_length: emb.embedding ? emb.embedding.length : 'unknown'
      });
    });

    // Try direct SQL query for vector search
    if (embeddingsData.length > 0) {
      // Use the first embedding for testing
      const testEmb = embeddingsData[0];
      
      if (!testEmb.embedding) {
        logger.error('Test embedding has no vector data');
        return;
      }

      logger.info('Using test embedding', { 
        id: testEmb.id,
        document_id: testEmb.document_id,
        embedding_length: testEmb.embedding.length 
      });
      
      // Try direct similarity search using this embedding as the query
      const { data: results, error: searchError } = await supabaseClient.rpc(
        'match_documents',
        {
          query_embedding: testEmb.embedding,
          match_threshold: 0.0, // Very low threshold to get all results
          match_count: 5,
          filter: {}
        }
      );
      
      if (searchError) {
        logger.error('Error performing direct similarity search', { 
          error: searchError,
          details: JSON.stringify(searchError)
        });
        return;
      }
      
      logger.info('Direct similarity search results:', { count: results?.length || 0 });
      if (results && results.length > 0) {
        results.forEach((result: any, i: number) => {
          logger.info(`Result ${i + 1}:`, {
            document_id: result.document_id,
            similarity: result.similarity,
            content: result.content?.substring(0, 50) + '...'
          });
        });
      }
      
      // Try with a new query embedding
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: config.llm.openaiApiKey,
        modelName: "text-embedding-ada-002",
      });
      
      const queryEmbedding = await embeddings.embedQuery("What is artificial intelligence?");
      
      logger.info('Generated test query embedding', { 
        length: queryEmbedding.length 
      });
      
      const { data: queryResults, error: queryError } = await supabaseClient.rpc(
        'match_documents',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.0, // Very low threshold to get all results
          match_count: 5,
          filter: {}
        }
      );
      
      if (queryError) {
        logger.error('Error performing query similarity search', { 
          error: queryError,
          details: JSON.stringify(queryError)
        });
        return;
      }
      
      logger.info('Query similarity search results:', { count: queryResults?.length || 0 });
      if (queryResults && queryResults.length > 0) {
        queryResults.forEach((result: any, i: number) => {
          logger.info(`Result ${i + 1}:`, {
            document_id: result.document_id,
            similarity: result.similarity,
            content: result.content?.substring(0, 50) + '...'
          });
        });
      }
    }

  } catch (error) {
    logger.error('Error in debug script', { error });
    process.exit(1);
  }
}

main(); 