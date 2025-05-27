import { OpenAIEmbeddings } from '@langchain/openai';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { DocumentWithEmbedding } from './embeddingService.js';
import { DocumentRepository } from '../services/supabase/documentRepository.js';

/**
 * Interface for document match results from the match_documents function
 */
interface DocumentMatch {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

/**
 * VectorStore service for Supabase pgvector
 */
export class VectorStoreService {
  private embeddings: OpenAIEmbeddings;
  private documentRepository: DocumentRepository;
  
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.llm.openaiApiKey,
      modelName: config.llm.embeddingModel,
    });
    this.documentRepository = new DocumentRepository();
  }
  
  /**
   * Store documents with their embeddings in the vector store
   */
  async storeDocuments(documentsWithEmbeddings: DocumentWithEmbedding[]): Promise<string[]> {
    try {
      logger.info('Storing documents in vector store', { count: documentsWithEmbeddings.length });
      return await this.documentRepository.storeDocuments(documentsWithEmbeddings);
    } catch (error) {
      logger.error('Error storing documents in vector store', { error });
      throw new Error('Failed to store documents: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Store a single document with its embedding in the vector store
   */
  async storeDocument(documentWithEmbedding: DocumentWithEmbedding): Promise<string> {
    try {
      logger.info('Storing single document in vector store');
      return await this.documentRepository.storeDocument(documentWithEmbedding);
    } catch (error) {
      logger.error('Error storing document in vector store', { error });
      throw new Error('Failed to store document: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Search for similar documents using the vector store
   */
  async similaritySearch(query: string, k: number = 5): Promise<LangChainDocument[]> {
    try {
      logger.info('Performing similarity search', { query, k });
      
      // First, get embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // Find similar documents
      const matches = await this.documentRepository.findSimilarDocuments(
        queryEmbedding,
        k,
        0.1 // Lower threshold to get more results
      );
      
      // Convert to LangChain documents
      const documents = this.documentRepository.toLangChainDocuments(matches);
      
      logger.info('Similarity search complete', { resultCount: documents.length });
      return documents;
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
    const originalSearch = this.similaritySearch.bind(this);
    cachedService.similaritySearch = async (query: string, k: number = 5): Promise<LangChainDocument[]> => {
      const cacheKey = `${query}:${k}`;
      const now = Date.now();
      
      // Check if we have a valid cached result
      const cachedResult = cache.get(cacheKey);
      if (cachedResult && (now - cachedResult.timestamp < ttlMs)) {
        logger.info('Using cached similarity search result', { query, k });
        return cachedResult.documents;
      }
      
      // Perform the search using the original method
      const results = await originalSearch(query, k);
      
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