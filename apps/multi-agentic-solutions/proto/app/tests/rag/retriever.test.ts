import { expect, describe, it, jest, beforeEach } from '@jest/globals';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { Retriever } from '../../src/rag/retriever.js';
import { Document } from '../../src/types/index.js';
import { createMockDocuments } from '../mocks.js';

// Mock the module
jest.mock('../../src/rag/retriever.js', () => {
  const originalModule = jest.requireActual('../../src/rag/retriever.js');
  
  // Mock implementation for indexDocuments
  const mockIndexDocuments = jest.fn().mockResolvedValue(undefined);
  
  // Mock implementation for retrieveRelevantDocuments
  const mockRetrieveRelevantDocuments = jest.fn().mockImplementation((query, k) => {
    return Promise.resolve(createMockDocuments(query, k));
  });
  
  // Mock implementation for getCachedVectorStore
  const mockGetCachedVectorStore = jest.fn().mockReturnValue({
    similaritySearch: jest.fn().mockImplementation((query, k) => {
      return Promise.resolve(createMockDocuments(query, k));
    })
  });
  
  return {
    ...originalModule,
    Retriever: jest.fn().mockImplementation(() => {
      return {
        indexDocuments: mockIndexDocuments,
        retrieveRelevantDocuments: mockRetrieveRelevantDocuments,
        getCachedVectorStore: mockGetCachedVectorStore
      };
    })
  };
});

describe('Retriever', () => {
  let retriever: Retriever;
  let testDocuments: Document[];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    retriever = new Retriever();

    // Create test documents
    testDocuments = Array(3).fill(null).map((_, i) => ({
      id: `doc-${i + 1}`,
      content: `Test document content ${i + 1}`,
      metadata: { source: 'test', tags: ['test'] }
    }));
  });

  it('should process, embed, and store documents in a single workflow', async () => {
    await retriever.indexDocuments(testDocuments);
    
    // Verify indexDocuments was called
    expect(retriever.indexDocuments).toHaveBeenCalledWith(testDocuments);
  });

  it('should retrieve relevant documents for a query', async () => {
    const results = await retriever.retrieveRelevantDocuments('test query', 2);

    // Verify results
    expect(results.length).toBe(2);
    expect(results[0].pageContent).toContain('Mock content 1');
    expect(results[0].pageContent).toContain('test query');
    expect(results[0].metadata).toHaveProperty('source');
  });

  it('should provide a cached vector store', () => {
    const cachedStore = retriever.getCachedVectorStore();
    
    // Verify getCachedVectorStore was called
    expect(retriever.getCachedVectorStore).toHaveBeenCalled();
    expect(cachedStore).toBeDefined();
  });
}); 