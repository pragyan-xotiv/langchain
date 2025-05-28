// Basic document type
export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

// LangChain document type
export interface LangChainDocument {
  pageContent: string;
  metadata: Record<string, unknown>;
}

// Document with embedding
export interface DocumentWithEmbedding {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

// Processor options
export interface ProcessorOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  metadataExtractors?: Array<(doc: Document) => Record<string, unknown>>;
}

// Configuration for the knowledge layer
export interface KnowledgeLayerConfig {
  embeddingModel?: string;
  retrievalK?: number;
  cacheTTL?: number;
} 