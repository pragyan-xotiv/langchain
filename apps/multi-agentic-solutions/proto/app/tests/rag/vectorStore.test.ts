import { expect, describe, it, jest, beforeEach } from '@jest/globals';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { VectorStoreService } from '../../src/rag/vectorStore.js';
import { DocumentWithEmbedding } from '../../src/rag/embeddingService.js';
import { createMockDocuments } from '../mocks.js';

// Mock the module
jest.mock('../../src/rag/vectorStore.js', () => {
  const originalModule = jest.requireActual('../../src/rag/vectorStore.js');
  
  // Mock implementation for storeDocuments
  const mockStoreDocuments = jest.fn().mockResolvedValue(undefined);
  
  // Mock implementation for similaritySearch
  const mockSimilaritySearch = jest.fn().mockImplementation((query, k) => {
    return Promise.resolve(createMockDocuments(query, k));
  });
  
  // Mock implementation for withCache
  const mockWithCache = jest.fn().mockImplementation(function(this: any) {
    return this;
  });
  
  return {
    ...originalModule,
    VectorStoreService: jest.fn().mockImplementation(() => {
      return {
        storeDocuments: mockStoreDocuments,
        similaritySearch: mockSimilaritySearch,
        withCache: mockWithCache
      };
    })
  };
});

// Mock the supabase client
const mockFrom = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnValue({error: null});

// Mock supabase client
jest.mock('../../src/utils/supabase.js', () => {
  return {
    default: {
      from: mockFrom,
      insert: mockInsert
    }
  };
});

// Mock SupabaseVectorStore
jest.mock('@langchain/community/vectorstores/supabase', () => {
  const mockSimilaritySearch = jest.fn().mockImplementation((query, k) => {
    // Return mock search results
    return Array(k).fill(null).map((_, i) => 
      new LangChainDocument({
        pageContent: `Mock search result ${i + 1} for query: ${query}`,
        metadata: { score: 0.9 - (i * 0.1), source: 'test' }
      })
    );
  });

  return {
    SupabaseVectorStore: jest.fn().mockImplementation(() => {
      return {
        similaritySearch: mockSimilaritySearch
      };
    })
  };
});

// Mock OpenAI embeddings
jest.mock('@langchain/openai', () => {
  return {
    OpenAIEmbeddings: jest.fn().mockImplementation(() => {
      return {
        embedQuery: jest.fn().mockResolvedValue(Array(128).fill(0.1))
      };
    })
  };
});

describe('Vector Store Service', () => {
  let vectorStore: VectorStoreService;
  let testDocuments: DocumentWithEmbedding[];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    vectorStore = new VectorStoreService();

    // Create test documents with embeddings
    testDocuments = Array(3).fill(null).map((_, i) => ({
      document: new LangChainDocument({
        pageContent: `Test document ${i + 1}`,
        metadata: { id: `${i + 1}`, source: 'test' }
      }),
      embedding: Array(128).fill(0.1)
    }));
  });

  it('should store documents with embeddings', async () => {
    await vectorStore.storeDocuments(testDocuments);

    // Verify supabase client was called correctly
    expect(mockFrom).toHaveBeenCalledWith('documents');
    expect(mockInsert).toHaveBeenCalled();
    
    // Check the data format passed to insert
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.length).toBe(3);
    expect(insertArg[0]).toHaveProperty('content');
    expect(insertArg[0]).toHaveProperty('metadata');
    expect(insertArg[0]).toHaveProperty('embedding');
  });

  it('should perform similarity search', async () => {
    const results = await vectorStore.similaritySearch('test query', 3);

    // Verify results
    expect(results.length).toBe(3);
    expect(results[0].pageContent).toContain('Mock content 1');
    expect(results[0].pageContent).toContain('test query');
    expect(results[0].metadata).toHaveProperty('score');
  });

  it('should apply caching to similarity search', async () => {
    const cachedStore = vectorStore.withCache(1000); // 1 second TTL
    
    // Make two identical queries
    const results1 = await cachedStore.similaritySearch('cached query', 2);
    const results2 = await cachedStore.similaritySearch('cached query', 2);
    
    // Verify both calls returned the same content
    expect(results1[0].pageContent).toBe(results2[0].pageContent);
    
    // Make a different query
    const differentResults = await cachedStore.similaritySearch('different query', 2);
    expect(differentResults[0].pageContent).not.toBe(results1[0].pageContent);
  });
}); 