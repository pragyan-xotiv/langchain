import { Document as LangChainDocument } from '@langchain/core/documents';
import supabaseClient from './client.js';
import { withTransaction, TransactionResult } from './transaction.js';
import { logger } from '../../utils/logger.js';
import { DocumentWithEmbedding } from '../../rag/embeddingService.js';

/**
 * Interface for document match results from the match_documents function
 */
export interface DocumentMatch {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

/**
 * Document repository for Supabase operations
 */
export class DocumentRepository {
  /**
   * Store a single document with its embedding
   * @param documentWithEmbedding Document with its embedding
   * @returns Document ID if successful
   */
  async storeDocument(documentWithEmbedding: DocumentWithEmbedding): Promise<string> {
    const result = await withTransaction(async () => {
      // Insert the document
      const { data: insertedDoc, error: docError } = await supabaseClient
        .from('documents')
        .insert({
          content: documentWithEmbedding.document.pageContent,
          metadata: documentWithEmbedding.document.metadata
        })
        .select('id')
        .single();
      
      if (docError) {
        throw docError;
      }
      
      if (!insertedDoc) {
        throw new Error('Failed to insert document');
      }
      
      // Insert the embedding
      const { error: embeddingError } = await supabaseClient
        .from('embeddings')
        .insert({
          document_id: insertedDoc.id,
          embedding: documentWithEmbedding.embedding,
          metadata: {} // Optional metadata specific to the embedding
        });
      
      if (embeddingError) {
        throw embeddingError;
      }
      
      return insertedDoc.id;
    });
    
    if (!result.success || !result.data) {
      throw result.error || new Error('Failed to store document');
    }
    
    return result.data;
  }
  
  /**
   * Store multiple documents with their embeddings
   * @param documentsWithEmbeddings Array of documents with embeddings
   * @returns Array of document IDs if successful
   */
  async storeDocuments(documentsWithEmbeddings: DocumentWithEmbedding[]): Promise<string[]> {
    logger.info('Storing documents in vector store', { count: documentsWithEmbeddings.length });
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    const documentIds: string[] = [];
    
    try {
      for (let i = 0; i < documentsWithEmbeddings.length; i += batchSize) {
        const batch = documentsWithEmbeddings.slice(i, i + batchSize);
        
        logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}`, { 
          size: batch.length, 
          startIndex: i 
        });
        
        const result = await withTransaction<string[]>(async () => {
          try {
            // Insert documents first
            const { data: insertedDocs, error: docsError } = await supabaseClient
              .from('documents')
              .insert(
                batch.map(item => ({
                  content: item.document.pageContent,
                  metadata: item.document.metadata
                }))
              )
              .select('id');
            
            if (docsError) {
              logger.error('Error inserting documents', { 
                error: docsError.message,
                details: JSON.stringify(docsError),
                code: docsError.code
              });
              throw docsError;
            }

            if (!insertedDocs || insertedDocs.length !== batch.length) {
              logger.error('Document insert count mismatch', {
                expected: batch.length,
                received: insertedDocs?.length || 0
              });
              throw new Error(`Failed to insert all documents: expected ${batch.length}, got ${insertedDocs?.length || 0}`);
            }
            
            logger.debug('Documents inserted successfully', { count: insertedDocs.length });
            
            // Insert embeddings with reference to the document IDs
            const { error: embeddingsError } = await supabaseClient
              .from('embeddings')
              .insert(
                batch.map((item, index) => ({
                  document_id: insertedDocs[index].id,
                  embedding: item.embedding,
                  metadata: {} // Optional metadata specific to the embedding
                }))
              );
            
            if (embeddingsError) {
              logger.error('Error inserting embeddings', { 
                error: embeddingsError.message,
                details: JSON.stringify(embeddingsError),
                code: embeddingsError.code
              });
              throw embeddingsError;
            }
            
            logger.debug('Embeddings inserted successfully', { count: batch.length });
            return insertedDocs.map(doc => doc.id);
          } catch (error) {
            logger.error('Error in transaction callback', {
              error: error instanceof Error ? error.message : JSON.stringify(error)
            });
            throw error;
          }
        });
        
        if (!result.success || !result.data) {
          logger.error('Batch insert failed', {
            batchIndex: Math.floor(i / batchSize),
            error: result.error?.message
          });
          throw result.error || new Error('Failed to store documents batch');
        }
        
        documentIds.push(...result.data);
        
        logger.debug(`Stored batch ${Math.floor(i / batchSize) + 1}`, { size: batch.length });
        
        // Small delay between batches
        if (i + batchSize < documentsWithEmbeddings.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      logger.info('Documents stored successfully', { count: documentIds.length });
      return documentIds;
    } catch (error) {
      logger.error('Error in storeDocuments', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : JSON.stringify(error)
      });
      throw error;
    }
  }
  
  /**
   * Search for similar documents
   * @param queryEmbedding Query embedding vector
   * @param limit Maximum number of results
   * @param threshold Similarity threshold
   * @param filter Optional filter criteria
   * @returns Array of matching documents
   */
  async findSimilarDocuments(
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0.1,
    filter: Record<string, any> = {}
  ): Promise<DocumentMatch[]> {
    logger.debug('Searching for similar documents', { 
      embeddingLength: queryEmbedding.length, 
      threshold, 
      limit,
      hasFilter: Object.keys(filter).length > 0
    });
    
    const { data, error } = await supabaseClient.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter
    });
    
    if (error) {
      logger.error('Error finding similar documents', { 
        error, 
        details: JSON.stringify(error),
        code: error.code,
        message: error.message
      });
      throw error;
    }
    
    logger.debug('Search results from database', { 
      count: data?.length || 0,
      hasResults: !!data && data.length > 0,
      firstResult: data && data.length > 0 ? {
        similarity: data[0].similarity,
        id: data[0].document_id
      } : null
    });
    
    return data || [];
  }
  
  /**
   * Convert document matches to LangChain documents
   * @param matches Document matches from the database
   * @returns Array of LangChain documents
   */
  toLangChainDocuments(matches: DocumentMatch[]): LangChainDocument[] {
    return matches.map(match => {
      return new LangChainDocument({
        pageContent: match.content,
        metadata: {
          ...match.metadata,
          id: match.document_id,
          similarity: match.similarity
        }
      });
    });
  }
} 