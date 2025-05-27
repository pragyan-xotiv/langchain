import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document as LangChainDocument } from '@langchain/core/documents';
import supabaseClient from '../utils/supabase.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { DocumentWithEmbedding } from './embeddingService.js';

/**
 * VectorStore service for Supabase pgvector
 */
export class VectorStoreService {
  private vectorStore: SupabaseVectorStore;
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.llm.openaiApiKey,
      modelName: config.llm.embeddingModel,
    });
    
    this.vectorStore = new SupabaseVectorStore(this.embeddings, {
      client: supabaseClient,
      tableName: 'documents',
      queryName: 'match_documents',
    });
  }
  
  /**
   * Store documents with their embeddings in the vector store
   */
  async storeDocuments(documentsWithEmbeddings: DocumentWithEmbedding[]): Promise<void> {
    try {
      logger.info('Storing documents in vector store', { count: documentsWithEmbeddings.length });
      
      // Process in batches to avoid overwhelming the database
      const batchSize = 50;
      
      for (let i = 0; i < documentsWithEmbeddings.length; i += batchSize) {
        const batch = documentsWithEmbeddings.slice(i, i + batchSize);
        
        // Insert documents with their embeddings
        const { error } = await supabaseClient
          .from('documents')
          .insert(
            batch.map(item => ({
              content: item.document.pageContent,
              metadata: item.document.metadata,
              embedding: item.embedding
            }))
          );
        
        if (error) {
          throw error;
        }
        
        logger.debug(`Stored batch ${Math.floor(i / batchSize) + 1}`, { size: batch.length });
        
        // Small delay between batches
        if (i + batchSize < documentsWithEmbeddings.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      logger.info('Documents stored successfully');
    } catch (error) {
      logger.error('Error storing documents in vector store', { error });
      throw new Error('Failed to store documents: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Search for similar documents using the vector store
   */
  async similaritySearch(query: string, k: number = 5): Promise<LangChainDocument[]> {
    try {
      logger.info('Performing similarity search', { query, k });
      const results = await this.vectorStore.similaritySearch(query, k);
      logger.info('Similarity search complete', { resultCount: results.length });
      return results;
    } catch (error) {
      logger.error('Error performing similarity search', { error, query });
      throw new Error('Failed to perform similarity search: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Create a caching layer for frequent queries
   * @param ttlMs Time to live in milliseconds
   */
  withCache(ttlMs: number = 5 * 60 * 1000): VectorStoreService {
    const cache = new Map<string, { documents: LangChainDocument[], timestamp: number }>();
    
    // Create a new instance with cached search
    const cachedService = new VectorStoreService();
    
    // Override the similarity search method to use cache
    cachedService.similaritySearch = async (query: string, k: number = 5): Promise<LangChainDocument[]> => {
      const cacheKey = `${query}:${k}`;
      const now = Date.now();
      
      // Check if we have a valid cached result
      const cachedResult = cache.get(cacheKey);
      if (cachedResult && (now - cachedResult.timestamp < ttlMs)) {
        logger.info('Using cached similarity search result', { query, k });
        return cachedResult.documents;
      }
      
      // Perform the search
      const results = await this.similaritySearch(query, k);
      
      // Cache the result
      cache.set(cacheKey, { documents: results, timestamp: now });
      
      // Clean up old cache entries
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > ttlMs) {
          cache.delete(key);
        }
      }
      
      return results;
    };
    
    return cachedService;
  }
} 