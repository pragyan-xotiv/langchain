import { Document as LangChainDocument } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@/types';

// Simple logger for Next.js
const logger = {
  info: (message: string, data?: Record<string, unknown>) => console.log(`INFO: ${message}`, data || ''),
  error: (message: string, data?: Record<string, unknown>) => console.error(`ERROR: ${message}`, data || ''),
};

export interface ProcessDocumentOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Process and chunk documents for RAG
 */
export async function processDocuments(
  documents: Document[],
  options: ProcessDocumentOptions = {}
): Promise<LangChainDocument[]> {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    metadata = {}
  } = options;

  try {
    logger.info('Processing documents', { count: documents.length, chunkSize, chunkOverlap });

    // Convert our Document type to LangChain Document type
    const langChainDocs = documents.map(doc => {
      return new LangChainDocument({
        pageContent: doc.content,
        metadata: {
          ...doc.metadata,
          ...metadata,
          documentId: doc.id
        }
      });
    });

    // Create text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap
    });
    
    // Split documents into chunks
    const chunks = await textSplitter.splitDocuments(langChainDocs);
    
    logger.info('Document processing complete', { 
      originalCount: documents.length, 
      chunkCount: chunks.length 
    });

    return chunks;
  } catch (error) {
    logger.error('Error processing documents', { error });
    throw new Error('Failed to process documents: ' + (error instanceof Error ? error.message : String(error)));
  }
} 