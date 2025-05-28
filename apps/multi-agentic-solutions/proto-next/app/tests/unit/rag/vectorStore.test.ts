import { VectorStoreService } from '@/lib/rag/vectorStore';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { DocumentWithEmbedding } from '@/lib/rag/embeddingService';

// Import the mocked modules directly to access mock functions
import { OpenAIEmbeddings } from '@langchain/openai';
import { DocumentRepository } from '@/lib/services/supabase/documentRepository';

// Mock dependencies
const mockStoreDocuments = jest.fn().mockResolvedValue(['doc-1', 'doc-2']);
const mockStoreDocument = jest.fn().mockResolvedValue('doc-3');
const mockFindSimilarDocuments = jest.fn().mockResolvedValue([
  { 
    id: 'doc-1', 
    document_id: 'doc-1', 
    content: 'Test content 1',
    metadata: { source: 'test-1' },
    similarity: 0.95
  },
  {
    id: 'doc-2', 
    document_id: 'doc-2', 
    content: 'Test content 2',
    metadata: { source: 'test-2' },
    similarity: 0.85
  }
]);

const mockToLangChainDocuments = jest.fn().mockImplementation((matches: Array<{
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}>) => {
  return matches.map(match => new LangChainDocument({
    pageContent: match.content,
    metadata: {
      ...match.metadata,
      id: match.id,
      document_id: match.document_id,
      similarity: match.similarity
    }
  }));
});

const mockEmbedQuery = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);

// Mock the OpenAIEmbeddings
jest.mock('@langchain/openai', () => {
  return {
    OpenAIEmbeddings: jest.fn().mockImplementation(() => {
      return {
        embedQuery: mockEmbedQuery
      };
    })
  };
});

// Mock the DocumentRepository
jest.mock('@/lib/services/supabase/documentRepository', () => {
  return {
    DocumentRepository: jest.fn().mockImplementation(() => {
      return {
        storeDocuments: mockStoreDocuments,
        storeDocument: mockStoreDocument,
        findSimilarDocuments: mockFindSimilarDocuments,
        toLangChainDocuments: mockToLangChainDocuments
      };
    })
  };
});

describe('Vector Store Service', () => {
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

  it('should create an instance with the correct configuration', () => {
    const vectorStore = new VectorStoreService();
    expect(vectorStore).toBeDefined();
    
    // Verify constructor dependencies were created
    expect(OpenAIEmbeddings).toHaveBeenCalled();
    expect(DocumentRepository).toHaveBeenCalled();
  });

  it('should store documents with embeddings', async () => {
    const vectorStore = new VectorStoreService();
    
    // Create test documents with embeddings
    const documentsWithEmbeddings: DocumentWithEmbedding[] = [
      {
        document: new LangChainDocument({
          pageContent: 'Test content 1',
          metadata: { source: 'test-1' }
        }),
        embedding: [0.1, 0.2, 0.3]
      },
      {
        document: new LangChainDocument({
          pageContent: 'Test content 2',
          metadata: { source: 'test-2' }
        }),
        embedding: [0.4, 0.5, 0.6]
      }
    ];
    
    // Store documents
    const result = await vectorStore.storeDocuments(documentsWithEmbeddings);
    
    // Verify result
    expect(result).toEqual(['doc-1', 'doc-2']);
    
    // Verify storeDocuments was called with the correct parameters
    expect(mockStoreDocuments).toHaveBeenCalledWith(documentsWithEmbeddings);
  });
  
  it('should store a single document with embedding', async () => {
    const vectorStore = new VectorStoreService();
    
    // Create a test document with embedding
    const documentWithEmbedding: DocumentWithEmbedding = {
      document: new LangChainDocument({
        pageContent: 'Test content 3',
        metadata: { source: 'test-3' }
      }),
      embedding: [0.7, 0.8, 0.9]
    };
    
    // Store document
    const result = await vectorStore.storeDocument(documentWithEmbedding);
    
    // Verify result
    expect(result).toEqual('doc-3');
    
    // Verify storeDocument was called with the correct parameters
    expect(mockStoreDocument).toHaveBeenCalledWith(documentWithEmbedding);
  });
  
  it('should perform similarity search', async () => {
    const vectorStore = new VectorStoreService();
    
    // Perform similarity search
    const results = await vectorStore.similaritySearch('test query', 2);
    
    // Verify embedQuery was called with the correct parameters
    expect(mockEmbedQuery).toHaveBeenCalledWith('test query');
    
    // Verify findSimilarDocuments was called with the correct parameters
    expect(mockFindSimilarDocuments).toHaveBeenCalledWith(
      [0.1, 0.2, 0.3], // Mock embedding
      2, // k value
      0.1 // threshold
    );
    
    // Verify toLangChainDocuments was called
    expect(mockToLangChainDocuments).toHaveBeenCalled();
    
    // Verify results
    expect(results).toHaveLength(2);
    expect(results[0].pageContent).toEqual('Test content 1');
    expect(results[0].metadata.similarity).toEqual(0.95);
    expect(results[1].pageContent).toEqual('Test content 2');
    expect(results[1].metadata.similarity).toEqual(0.85);
  });
  
  it('should create a cached version of the service', async () => {
    const vectorStore = new VectorStoreService();
    
    // Create cached service
    const cachedService = vectorStore.withCache();
    
    // Verify it's a VectorStoreService
    expect(cachedService).toBeInstanceOf(VectorStoreService);
    
    // First search - should miss cache
    await cachedService.similaritySearch('cached query', 2);
    
    // Search again with the same query - should hit cache
    await cachedService.similaritySearch('cached query', 2);
    
    // Verify embedQuery was called only once
    expect(mockEmbedQuery).toHaveBeenCalledTimes(1);
    
    // Verify findSimilarDocuments was called only once
    expect(mockFindSimilarDocuments).toHaveBeenCalledTimes(1);
  });
}); 