import { Document } from '../types/index.js';
import { processDocuments, ProcessDocumentOptions } from './documentProcessor.js';
import { EmbeddingService } from './embeddingService.js';
import { VectorStoreService } from './vectorStore.js';
import { logger } from '../utils/logger.js';

/**
 * RAG Retriever that coordinates document processing, embedding generation, and storage
 */
export class Retriever {
  private documentProcessor: typeof processDocuments;
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStoreService;
  
  constructor() {
    this.documentProcessor = processDocuments;
    this.embeddingService = new EmbeddingService();
    this.vectorStore = new VectorStoreService();
  }
  
  /**
   * Process and index documents in a single workflow
   */
  async indexDocuments(
    documents: Document[], 
    options: ProcessDocumentOptions = {}
  ): Promise<void> {
    try {
      logger.info('Starting document indexing workflow', { count: documents.length });
      
      // Step 1: Process and chunk documents
      const chunks = await this.documentProcessor(documents, options);
      logger.info('Documents processed into chunks', { chunkCount: chunks.length });
      
      // Step 2: Generate embeddings
      const documentsWithEmbeddings = await this.embeddingService.embedDocuments(chunks);
      logger.info('Embeddings generated', { count: documentsWithEmbeddings.length });
      
      // Step 3: Store in vector database
      await this.vectorStore.storeDocuments(documentsWithEmbeddings);
      logger.info('Documents indexed successfully', { count: documentsWithEmbeddings.length });
    } catch (error) {
      logger.error('Error indexing documents', { error });
      throw new Error('Failed to index documents: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Retrieve documents relevant to a query
   */
  async retrieveRelevantDocuments(query: string, k: number = 5) {
    try {
      return await this.vectorStore.similaritySearch(query, k);
    } catch (error) {
      logger.error('Error retrieving documents', { error, query });
      throw new Error('Failed to retrieve documents: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Get cached vector store for frequently accessed collections
   */
  getCachedVectorStore(ttlMs: number = 5 * 60 * 1000): VectorStoreService {
    return this.vectorStore.withCache(ttlMs);
  }
} 