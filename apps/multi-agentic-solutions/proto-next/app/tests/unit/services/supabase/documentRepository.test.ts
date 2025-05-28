import { DocumentRepository } from '@/lib/services/supabase/documentRepository';
import { Document as LangChainDocument } from '@langchain/core/documents';

// Define more specific types for the test
interface DocumentRecord {
  id: string;
  document_id?: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[]; // Make embedding optional
  similarity?: number;  // Add similarity for search results
}

// Define callback response type
interface SupabaseResponse {
  data: DocumentRecord[] | string[] | null;
  error: { message: string } | null;
}

// Type for callback function
type CallbackFn = (response: SupabaseResponse) => Promise<unknown> | unknown;

// Mock the Supabase client
jest.mock('@/lib/services/supabase/client', () => {
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();
  const mockUpsert = jest.fn();
  
  mockFrom.mockImplementation(() => ({
    upsert: mockUpsert.mockImplementation((records: DocumentRecord[]) => ({
      then: (callback: CallbackFn) => Promise.resolve(callback({ 
        data: records.map((r) => r.id), 
        error: null 
      }))
    }))
  }));
  
  mockRpc.mockImplementation(() => ({
    then: (callback: CallbackFn) => Promise.resolve(callback({ data: [], error: null }))
  }));
  
  return {
    supabaseClient: {
      from: mockFrom,
      rpc: mockRpc
    }
  };
});

// Import mocked client
import { supabaseClient } from '@/lib/services/supabase/client';

// Get the mocked functions for verification
const mockFrom = supabaseClient.from as jest.Mock;
const mockRpc = supabaseClient.rpc as jest.Mock;

describe('Document Repository', () => {
  // Mock console logging to avoid cluttering test output
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock crypto.randomUUID with proper UUID format
    if (!global.crypto) {
      global.crypto = {} as Crypto;
    }
    
    global.crypto.randomUUID = jest.fn().mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations with default success responses
    mockFrom.mockImplementation(() => ({
      upsert: jest.fn().mockImplementation((records: DocumentRecord[]) => ({
        then: (callback: CallbackFn) => Promise.resolve(callback({ 
          data: records.map((r) => r.id), 
          error: null 
        }))
      }))
    }));
    
    mockRpc.mockImplementation(() => ({
      then: (callback: CallbackFn) => Promise.resolve(callback({ data: [], error: null }))
    }));
  });

  it('should create an instance correctly', () => {
    const repository = new DocumentRepository();
    expect(repository).toBeDefined();
  });

  it('should store multiple documents with embeddings', async () => {
    const repository = new DocumentRepository();
    
    // Create test documents with embeddings
    const documentsWithEmbeddings = [
      {
        document: new LangChainDocument({
          pageContent: 'Test document 1',
          metadata: { documentId: 'doc-1', source: 'test-1' }
        }),
        embedding: [0.1, 0.2, 0.3]
      },
      {
        document: new LangChainDocument({
          pageContent: 'Test document 2',
          metadata: { documentId: 'doc-2', source: 'test-2' }
        }),
        embedding: [0.4, 0.5, 0.6]
      }
    ];
    
    // Store documents
    const result = await repository.storeDocuments(documentsWithEmbeddings);
    
    // Verify the supabase client was called correctly
    expect(mockFrom).toHaveBeenCalledWith('documents');
    
    // Verify returned document IDs
    expect(result).toEqual(['doc-1', 'doc-2']);
  });

  it('should store a single document with embedding', async () => {
    const repository = new DocumentRepository();
    
    // Create test document with embedding
    const documentWithEmbedding = {
      document: new LangChainDocument({
        pageContent: 'Test document 3',
        metadata: { documentId: 'doc-3', source: 'test-3' }
      }),
      embedding: [0.7, 0.8, 0.9]
    };
    
    // Store document
    const result = await repository.storeDocument(documentWithEmbedding);
    
    // Verify the result
    expect(result).toEqual('doc-3');
  });

  it('should find similar documents', async () => {
    // Mock matches for similarity search
    const mockMatches = [
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
    ];
    
    // Setup mock response for this test
    mockRpc.mockImplementation(() => ({
      then: (callback: CallbackFn) => Promise.resolve(callback({ data: mockMatches, error: null }))
    }));
    
    const repository = new DocumentRepository();
    
    // Query for similar documents
    const results = await repository.findSimilarDocuments([0.1, 0.2, 0.3], 2, 0.5);
    
    // Verify the supabase client was called correctly
    expect(mockRpc).toHaveBeenCalledWith('match_documents', {
      query_embedding: [0.1, 0.2, 0.3],
      match_threshold: 0.5,
      match_count: 2
    });
    
    // Verify returned matches
    expect(results).toEqual(mockMatches);
  });

  it('should convert Supabase document matches to LangChain documents', () => {
    const repository = new DocumentRepository();
    
    // Create test matches
    const matches = [
      { 
        id: 'doc-1', 
        document_id: 'parent-1', 
        content: 'Test content 1',
        metadata: { source: 'test-1' },
        similarity: 0.95
      },
      {
        id: 'doc-2', 
        document_id: 'parent-2', 
        content: 'Test content 2',
        metadata: { source: 'test-2' },
        similarity: 0.85
      }
    ];
    
    // Convert matches to LangChain documents
    const documents = repository.toLangChainDocuments(matches);
    
    // Verify the conversion
    expect(documents).toHaveLength(2);
    expect(documents[0].pageContent).toEqual('Test content 1');
    expect(documents[0].metadata).toHaveProperty('source', 'test-1');
    expect(documents[0].metadata).toHaveProperty('id', 'doc-1');
    expect(documents[0].metadata).toHaveProperty('document_id', 'parent-1');
    expect(documents[0].metadata).toHaveProperty('similarity', 0.95);
    
    expect(documents[1].pageContent).toEqual('Test content 2');
    expect(documents[1].metadata).toHaveProperty('similarity', 0.85);
  });

  it('should handle errors when storing documents', async () => {
    // Setup mock error response for this test
    mockFrom.mockImplementation(() => ({
      upsert: jest.fn().mockImplementation(() => ({
        then: (callback: CallbackFn) => Promise.resolve(callback({ 
          data: null, 
          error: { message: 'Database error' } 
        }))
      }))
    }));
    
    const repository = new DocumentRepository();
    
    // Create test document with embedding
    const documentWithEmbedding = {
      document: new LangChainDocument({
        pageContent: 'Test document',
        metadata: { documentId: 'doc-error', source: 'test-error' }
      }),
      embedding: [0.1, 0.2, 0.3]
    };
    
    // Expect storeDocuments to throw an error
    await expect(repository.storeDocuments([documentWithEmbedding])).rejects.toThrow('Failed to store documents');
  });

  it('should handle errors when finding similar documents', async () => {
    // Setup mock error response for this test
    mockRpc.mockImplementation(() => ({
      then: (callback: CallbackFn) => Promise.resolve(callback({ 
        data: null, 
        error: { message: 'Search error' } 
      }))
    }));
    
    const repository = new DocumentRepository();
    
    // Expect findSimilarDocuments to throw an error
    await expect(repository.findSimilarDocuments([0.1, 0.2, 0.3])).rejects.toThrow('Failed to find similar documents');
  });
}); 