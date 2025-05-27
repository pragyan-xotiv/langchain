import { OpenAIEmbeddings } from '@langchain/openai';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Document with embedding
 */
export interface DocumentWithEmbedding {
  document: LangChainDocument;
  embedding: number[];
}

/**
 * OpenAI embeddings client with retry logic
 */
export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.llm.openaiApiKey,
      modelName: config.llm.embeddingModel,
      maxConcurrency: 5, // Limit concurrent requests
    });
  }

  /**
   * Generate embeddings for a batch of documents with retry logic
   */
  async embedDocuments(documents: LangChainDocument[]): Promise<DocumentWithEmbedding[]> {
    try {
      logger.info('Generating embeddings', { count: documents.length });
      
      const batchSize = 20; // Process in smaller batches to avoid rate limits
      const results: DocumentWithEmbedding[] = [];
      
      // Process in batches
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        logger.debug(`Processing batch ${i / batchSize + 1}`, { size: batch.length });
        
        const embeddedBatch = await this.processBatch(batch);
        results.push(...embeddedBatch);
        
        // Small delay between batches to avoid rate limits
        if (i + batchSize < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      logger.info('Embeddings generation complete', { count: results.length });
      return results;
    } catch (error) {
      logger.error('Error generating embeddings', { error });
      throw new Error('Failed to generate embeddings: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Process a batch of documents with retry logic
   */
  private async processBatch(batch: LangChainDocument[]): Promise<DocumentWithEmbedding[]> {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        const texts = batch.map(doc => doc.pageContent);
        const embeddings = await this.embeddings.embedDocuments(texts);
        
        // Attach embeddings to documents
        return batch.map((doc, index) => {
          const docWithMetadata = new LangChainDocument({
            pageContent: doc.pageContent,
            metadata: {
              ...doc.metadata,
              embedding_model: config.llm.embeddingModel,
              embedding_timestamp: new Date().toISOString()
            }
          });
          
          return {
            document: docWithMetadata,
            embedding: embeddings[index]
          };
        });
      } catch (error) {
        retries++;
        logger.warn('Embedding batch failed, retrying', { 
          error: error instanceof Error ? error.message : String(error),
          retryCount: retries 
        });
        
        if (retries >= MAX_RETRIES) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
      }
    }
    
    // This should never happen due to the throw in the loop, but TypeScript needs it
    throw new Error('Failed to process batch after maximum retries');
  }

  /**
   * Generate a single embedding for a query
   */
  async embedQuery(text: string): Promise<number[]> {
    try {
      return await this.embeddings.embedQuery(text);
    } catch (error) {
      logger.error('Error generating query embedding', { error, query: text });
      throw new Error('Failed to generate query embedding: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
} 