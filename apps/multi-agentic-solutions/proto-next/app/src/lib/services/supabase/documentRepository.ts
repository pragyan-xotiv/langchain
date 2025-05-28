import { Document as LangChainDocument } from '@langchain/core/documents';
import { supabaseClient } from './client';
import { DocumentWithEmbedding } from '@/lib/rag/embeddingService';

// Simple logger for Next.js
const logger = {
  info: (message: string, data?: Record<string, unknown>) => console.log(`INFO: ${message}`, data || ''),
  error: (message: string, data?: Record<string, unknown>) => console.error(`ERROR: ${message}`, data || ''),
};

/**
 * Interface for document match results from the match_documents function
 */
interface DocumentMatch {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Repository for storing and retrieving documents from Supabase
 */
export class DocumentRepository {
  /**
   * Store multiple documents with embeddings
   */
  async storeDocuments(documentsWithEmbeddings: DocumentWithEmbedding[]): Promise<string[]> {
    try {
      const documentIds: string[] = [];
      
      // Process in smaller batches to avoid timeouts
      const batchSize = 50;
      for (let i = 0; i < documentsWithEmbeddings.length; i += batchSize) {
        const batch = documentsWithEmbeddings.slice(i, i + batchSize);
        
        // Transform batch into array of records to insert
        const records = batch.map(({ document, embedding }) => {
          const documentId = document.metadata.documentId as string || crypto.randomUUID();
          documentIds.push(documentId);
          
          return {
            id: documentId,
            content: document.pageContent,
            embedding,
            metadata: document.metadata
          };
        });
        
        // Insert batch into Supabase
        const { error } = await supabaseClient
          .from('documents')
          .upsert(records, { onConflict: 'id' });
        
        if (error) {
          throw error;
        }
      }
      
      return documentIds;
    } catch (error) {
      logger.error('Error storing documents in Supabase', { error });
      throw new Error('Failed to store documents: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Store a single document with embedding
   */
  async storeDocument(documentWithEmbedding: DocumentWithEmbedding): Promise<string> {
    const results = await this.storeDocuments([documentWithEmbedding]);
    return results[0];
  }
  
  /**
   * Find documents similar to a query embedding
   */
  async findSimilarDocuments(
    queryEmbedding: number[],
    limit: number = 5,
    similarityThreshold: number = 0.5
  ): Promise<DocumentMatch[]> {
    try {
      const { data, error } = await supabaseClient.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: similarityThreshold,
        match_count: limit
      });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      logger.error('Error finding similar documents', { error });
      throw new Error('Failed to find similar documents: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Convert Supabase document matches to LangChain documents
   */
  toLangChainDocuments(matches: DocumentMatch[]): LangChainDocument[] {
    return matches.map(match => {
      return new LangChainDocument({
        pageContent: match.content,
        metadata: {
          ...match.metadata,
          id: match.id,
          document_id: match.document_id,
          similarity: match.similarity
        }
      });
    });
  }
} 