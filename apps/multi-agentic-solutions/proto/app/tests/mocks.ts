import { Document as LangChainDocument } from '@langchain/core/documents';

/**
 * Mock utility functions for testing
 */

export type MockFn<T extends (...args: any[]) => any> = jest.Mock<ReturnType<T>, Parameters<T>>;

/**
 * Creates mock documents for similarity search results
 * @param query The search query
 * @param k Number of documents to return
 * @returns Array of LangChain documents
 */
export function createMockDocuments(query: string, k: number): LangChainDocument[] {
  if (query.includes('empty')) {
    return [];
  }
  return Array(k).fill(null).map((_, i) => 
    new LangChainDocument({
      pageContent: `Mock content ${i + 1} related to ${query}`,
      metadata: { source: `source-${i + 1}`, score: 0.9 - (i * 0.1) }
    })
  );
}

/**
 * Creates mock embeddings
 * @param size Size of embedding vector
 * @returns Array of numbers representing an embedding
 */
export function createMockEmbedding(size: number = 128): number[] {
  return Array(size).fill(0.1);
} 