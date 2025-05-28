import { Retriever } from '@/lib/rag/retriever';
import { processDocuments } from '@/lib/rag/documentProcessor';
import { EmbeddingService } from '@/lib/rag/embeddingService';
import { VectorStoreService } from '@/lib/rag/vectorStore';
import { Document } from '@/types';

// Mock the instance methods
const mockEmbedDocuments = jest.fn().mockResolvedValue([
  {
    document: {
      pageContent: 'Chunk 1 content',
      metadata: { documentId: 'doc-1', source: 'test-1' }
    },
    embedding: [0.1, 0.2, 0.3]
  },
  {
    document: {
      pageContent: 'Chunk 2 content',
      metadata: { documentId: 'doc-2', source: 'test-2' }
    },
    embedding: [0.4, 0.5, 0.6]
  }
]);

const mockStoreDocuments = jest.fn().mockResolvedValue(['doc-1', 'doc-2']);
const mockSimilaritySearch = jest.fn().mockResolvedValue([
  {
    pageContent: 'Relevant document content.',
    metadata: { source: 'test-doc.pdf' }
  }
]);
const mockWithCache = jest.fn().mockReturnThis();

// Mock dependencies
jest.mock('@/lib/rag/documentProcessor', () => ({
  processDocuments: jest.fn().mockResolvedValue([
    {
      pageContent: 'Chunk 1 content',
      metadata: { documentId: 'doc-1', source: 'test-1' }
    },
    {
      pageContent: 'Chunk 2 content',
      metadata: { documentId: 'doc-2', source: 'test-2' }
    }
  ])
}));

jest.mock('@/lib/rag/embeddingService', () => ({
  EmbeddingService: jest.fn().mockImplementation(() => ({
    embedDocuments: mockEmbedDocuments
  }))
}));

jest.mock('@/lib/rag/vectorStore', () => ({
  VectorStoreService: jest.fn().mockImplementation(() => ({
    storeDocuments: mockStoreDocuments,
    similaritySearch: mockSimilaritySearch,
    withCache: mockWithCache
  }))
}));

// Cast the mocked modules to jest.Mock
const MockedEmbeddingService = EmbeddingService as jest.Mock;
const MockedVectorStoreService = VectorStoreService as jest.Mock;

describe('Retriever', () => {
  // Mock console logging to avoid cluttering test output
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an instance with the correct dependencies', () => {
    const retriever = new Retriever();
    expect(retriever).toBeDefined();
    
    // Verify that dependencies were initialized
    expect(MockedEmbeddingService).toHaveBeenCalled();
    expect(MockedVectorStoreService).toHaveBeenCalled();
  });

  it('should process and index documents', async () => {
    const retriever = new Retriever();
    
    // Create test documents
    const documents: Document[] = [
      {
        id: 'doc-1',
        content: 'Test document 1 content',
        metadata: { source: 'test-1' }
      },
      {
        id: 'doc-2',
        content: 'Test document 2 content',
        metadata: { source: 'test-2' }
      }
    ];
    
    // Index documents
    await retriever.indexDocuments(documents);
    
    // Verify that the document processor was called with the documents
    expect(processDocuments).toHaveBeenCalledWith(documents, {});
    
    // Verify that embeddings were generated for the processed chunks
    expect(mockEmbedDocuments).toHaveBeenCalled();
    
    // Verify that documents were stored in the vector store
    expect(mockStoreDocuments).toHaveBeenCalled();
  });

  it('should retrieve relevant documents for a query', async () => {
    const retriever = new Retriever();
    
    // Retrieve documents
    const results = await retriever.retrieveRelevantDocuments('test query');
    
    // Verify that the vector store was searched
    expect(mockSimilaritySearch).toHaveBeenCalledWith('test query', 5);
    
    // Verify results
    expect(results).toHaveLength(1);
    expect(results[0].pageContent).toEqual('Relevant document content.');
  });

  it('should get a cached vector store', () => {
    const retriever = new Retriever();
    
    // Get cached vector store
    const cachedStore = retriever.getCachedVectorStore(10000);
    
    // Verify that withCache was called on the vector store
    expect(mockWithCache).toHaveBeenCalledWith(10000);
    
    // Verify the returned instance
    expect(cachedStore).toBeDefined();
  });

  it('should handle errors in indexDocuments gracefully', async () => {
    // Mock processDocuments to throw an error
    (processDocuments as jest.Mock).mockRejectedValueOnce(new Error('Processing error'));
    
    const retriever = new Retriever();
    
    // Expect indexDocuments to throw an error
    await expect(retriever.indexDocuments([{ id: 'doc-3', content: 'Test' }]))
      .rejects.toThrow('Failed to index documents');
  });

  it('should handle errors in retrieveRelevantDocuments gracefully', async () => {
    // Mock similaritySearch to throw an error
    mockSimilaritySearch.mockRejectedValueOnce(new Error('Search error'));
    
    const retriever = new Retriever();
    
    // Expect retrieveRelevantDocuments to throw an error
    await expect(retriever.retrieveRelevantDocuments('error query'))
      .rejects.toThrow('Failed to retrieve documents');
  });
}); 