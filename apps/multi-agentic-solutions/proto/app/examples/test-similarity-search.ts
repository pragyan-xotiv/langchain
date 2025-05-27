#!/usr/bin/env ts-node

/**
 * Simple test script for vector similarity search
 * 
 * This script:
 * 1. Creates and embeds a test document
 * 2. Stores it in the database
 * 3. Performs a similarity search with the same embedding
 * 4. Prints the results
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { Document as LangChainDocument } from '@langchain/core/documents';
import supabaseClient from '../src/utils/supabase.js';
import { config } from '../src/config/environment.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  try {
    // 1. Create a test document
    const testDocument = new LangChainDocument({
      pageContent: "Artificial intelligence (AI) is intelligence demonstrated by machines.",
      metadata: {
        source: "test",
        test_id: "similarity-search-test"
      }
    });
    
    logger.info('Created test document');
    
    // 2. Generate embedding
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.llm.openaiApiKey,
      modelName: "text-embedding-ada-002",
    });
    
    const embedding = await embeddings.embedDocuments([testDocument.pageContent]);
    logger.info('Generated embedding', { dimensions: embedding[0].length });
    
    // 3. Store document in database
    const { data: docData, error: docError } = await supabaseClient
      .from('documents')
      .insert({
        content: testDocument.pageContent,
        metadata: testDocument.metadata
      })
      .select('id')
      .single();
      
    if (docError) {
      logger.error('Error storing document', { error: docError });
      return;
    }
    
    const documentId = docData.id;
    logger.info('Stored document', { id: documentId });
    
    // 4. Store embedding
    const { error: embError } = await supabaseClient
      .from('embeddings')
      .insert({
        document_id: documentId,
        embedding: embedding[0],
        metadata: {}
      });
      
    if (embError) {
      logger.error('Error storing embedding', { 
        error: embError,
        details: JSON.stringify(embError)
      });
      return;
    }
    
    logger.info('Stored embedding for document', { documentId });
    
    // 5. Perform a similarity search using the same embedding
    logger.info('Testing similarity search with same embedding...');
    const { data: results, error: searchError } = await supabaseClient.rpc(
      'match_documents',
      {
        query_embedding: embedding[0],
        match_threshold: -1.0, // Use negative threshold to get all results
        match_count: 10,
        filter: {}
      }
    );
    
    if (searchError) {
      logger.error('Error performing similarity search', { 
        error: searchError,
        details: JSON.stringify(searchError)
      });
      return;
    }
    
    logger.info('Similarity search results (should include our document):', {
      count: results?.length || 0
    });
    
    if (results && results.length > 0) {
      results.forEach((result: any, i: number) => {
        logger.info(`Result ${i + 1}:`, {
          document_id: result.document_id,
          similarity: result.similarity,
          is_our_document: result.document_id === documentId,
          content: result.content?.substring(0, 50) + '...'
        });
      });
    } else {
      logger.warn('No results found. This suggests the similarity search is not working properly.');
    }
    
    // 6. Try another search with different query
    const queryText = "What is AI?";
    logger.info('Testing similarity search with new query:', { query: queryText });
    
    const queryEmbedding = await embeddings.embedQuery(queryText);
    
    const { data: queryResults, error: queryError } = await supabaseClient.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: -1.0, // Use negative threshold to get all results
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
    
    logger.info('Query similarity search results:', {
      count: queryResults?.length || 0
    });
    
    if (queryResults && queryResults.length > 0) {
      queryResults.forEach((result: any, i: number) => {
        logger.info(`Result ${i + 1}:`, {
          document_id: result.document_id,
          similarity: result.similarity,
          is_our_document: result.document_id === documentId,
          content: result.content?.substring(0, 50) + '...'
        });
      });
    }
    
    // 7. Clean up (optional)
    /*
    logger.info('Cleaning up test data...');
    await supabaseClient.from('embeddings').delete().eq('document_id', documentId);
    await supabaseClient.from('documents').delete().eq('id', documentId);
    logger.info('Test data cleaned up');
    */
    
  } catch (error) {
    logger.error('Error in test script', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

main(); 