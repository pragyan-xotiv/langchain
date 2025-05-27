#!/usr/bin/env ts-node

/**
 * Test script using the simpler vector search function
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { Document as LangChainDocument } from '@langchain/core/documents';
import supabaseClient from '../src/utils/supabase.js';
import { config } from '../src/config/environment.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  try {
    // First, let's check the actual dimensions of OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.llm.openaiApiKey,
      modelName: "text-embedding-ada-002",
    });
    
    const testQuery = "Test query for dimension check";
    const queryEmbedding = await embeddings.embedQuery(testQuery);
    
    logger.info('Generated OpenAI embedding has dimensions:', { 
      length: queryEmbedding.length,
      first3Values: queryEmbedding.slice(0, 3),
      last3Values: queryEmbedding.slice(-3)
    });
    
    // Check if we have embeddings in the database
    const { data: embeddingsCount, error: countError } = await supabaseClient
      .from('embeddings')
      .select('id', { count: 'exact' });
    
    if (countError) {
      logger.error('Error counting embeddings', { error: countError });
      return;
    }
    
    const count = embeddingsCount ? embeddingsCount.length : 0;
    logger.info('Number of embeddings in database:', { count });
    
    if (count > 0) {
      // Check the structure of the first embedding
      const { data: firstEmb, error: embError } = await supabaseClient
        .from('embeddings')
        .select('embedding')
        .limit(1)
        .single();
      
      if (embError) {
        logger.error('Error fetching embedding sample', { error: embError });
      } else if (firstEmb && firstEmb.embedding) {
        const embeddingArray = firstEmb.embedding;
        logger.info('Sample embedding from database:', {
          type: typeof embeddingArray,
          isArray: Array.isArray(embeddingArray),
          length: Array.isArray(embeddingArray) ? embeddingArray.length : 'not an array',
          sample: Array.isArray(embeddingArray) 
            ? [embeddingArray[0], embeddingArray[1], '...', embeddingArray[embeddingArray.length-1]]
            : String(embeddingArray).substring(0, 100) + '...'
        });
      }
      
      // Try the simple_match_documents function
      try {
        logger.info('Testing simple_match_documents function...');
        const { data: simpleResults, error: simpleError } = await supabaseClient.rpc(
          'simple_match_documents',
          {
            query_embedding: queryEmbedding,
            match_count: 5
          }
        );
        
        if (simpleError) {
          logger.error('Error with simple_match_documents', { 
            error: simpleError,
            details: JSON.stringify(simpleError)
          });
        } else {
          logger.info('Simple match results:', { 
            count: simpleResults?.length || 0,
            results: simpleResults
          });
        }
      } catch (fnError) {
        logger.error('Exception calling simple_match_documents', { 
          error: fnError instanceof Error ? fnError.message : String(fnError)
        });
      }
    }
    
    // Create a new test document and embedding
    const testDocument = new LangChainDocument({
      pageContent: "This is a test document for the simple vector search function.",
      metadata: {
        source: "simple-test",
        test_id: "simple-match-test"
      }
    });
    
    // Generate embedding
    const docEmbedding = await embeddings.embedDocuments([testDocument.pageContent]);
    logger.info('Generated document embedding', { dimensions: docEmbedding[0].length });
    
    // Store document
    const { data: docData, error: docError } = await supabaseClient
      .from('documents')
      .insert({
        content: testDocument.pageContent,
        metadata: testDocument.metadata
      })
      .select('id')
      .single();
      
    if (docError) {
      logger.error('Error storing test document', { error: docError });
      return;
    }
    
    const documentId = docData.id;
    logger.info('Stored test document', { id: documentId });
    
    // Store embedding
    const { error: storeEmbError } = await supabaseClient
      .from('embeddings')
      .insert({
        document_id: documentId,
        embedding: docEmbedding[0],
        metadata: {}
      });
      
    if (storeEmbError) {
      logger.error('Error storing test embedding', { error: storeEmbError });
      return;
    }
    
    logger.info('Stored embedding for test document');
    
    // Try to find our document with the simple match function
    const { data: matchResults, error: matchError } = await supabaseClient.rpc(
      'simple_match_documents',
      {
        query_embedding: docEmbedding[0],
        match_count: 5
      }
    );
    
    if (matchError) {
      logger.error('Error finding test document', { error: matchError });
      return;
    }
    
    logger.info('Search results for our new document:', { 
      count: matchResults?.length || 0
    });
    
    if (matchResults && matchResults.length > 0) {
      matchResults.forEach((result: any, i: number) => {
        logger.info(`Result ${i + 1}:`, {
          document_id: result.document_id,
          is_our_document: result.document_id === documentId,
          similarity: result.similarity,
          content: result.content?.substring(0, 50) + '...'
        });
      });
    } else {
      logger.warn('No results found for our test document');
    }
    
  } catch (error) {
    logger.error('Error in test script', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

main(); 