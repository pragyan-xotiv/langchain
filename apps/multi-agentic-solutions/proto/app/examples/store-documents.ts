#!/usr/bin/env ts-node

/**
 * Example script to demonstrate storing documents in the vector store
 * 
 * Usage: ts-node examples/store-documents.ts
 */

import { Document as LangChainDocument } from '@langchain/core/documents';
import { VectorStoreService } from '../src/rag/vectorStore.js';
import { EmbeddingService } from '../src/rag/embeddingService.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  try {
    // Create sample documents
    const documents = [
      new LangChainDocument({
        pageContent: "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans.",
        metadata: {
          source: "wikipedia",
          topic: "AI",
          date: "2023-05-27"
        }
      }),
      new LangChainDocument({
        pageContent: "Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks.",
        metadata: {
          source: "wikipedia",
          topic: "machine learning",
          date: "2023-05-27"
        }
      }),
      new LangChainDocument({
        pageContent: "Natural language processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language.",
        metadata: {
          source: "wikipedia",
          topic: "NLP",
          date: "2023-05-27"
        }
      })
    ];

    logger.info('Generating embeddings for documents...');
    
    // Create embedding service
    const embeddingService = new EmbeddingService();
    
    // Generate embeddings for the documents
    const documentsWithEmbeddings = await embeddingService.embedDocuments(documents);
    
    logger.info('Embeddings generated successfully');
    
    // Create vector store service
    const vectorStore = new VectorStoreService();
    
    // Store documents with embeddings
    const documentIds = await vectorStore.storeDocuments(documentsWithEmbeddings);
    
    logger.info('Documents stored successfully in vector store', { documentIds });

    // Perform a similarity search
    const query = "What is artificial intelligence?";
    logger.info('Performing similarity search...', { query });
    
    const results = await vectorStore.similaritySearch(query, 2);
    
    logger.info('Search results:');
    results.forEach((doc, i) => {
      logger.info(`Result ${i + 1}:`, {
        content: doc.pageContent,
        metadata: doc.metadata
      });
    });

    // Demonstrate caching
    logger.info('Running the same query again to demonstrate caching...');
    const cachedVectorStore = vectorStore.withCache(60000); // 1 minute cache
    
    const startTime = Date.now();
    const cachedResults = await cachedVectorStore.similaritySearch(query, 2);
    logger.info(`Cached query completed in ${Date.now() - startTime}ms with ${cachedResults.length} results`);

  } catch (error) {
    logger.error('Error in example script', { error });
    process.exit(1);
  }
}

main(); 