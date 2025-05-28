import { EmbeddingService } from '@/lib/rag/embeddingService';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';

// Mock OpenAIEmbeddings
jest.mock('@langchain/openai', () => {
  return {
    OpenAIEmbeddings: jest.fn().mockImplementation(() => {
      return {
        embedDocuments: jest.fn().mockResolvedValue([
          [0.1, 0.2, 0.3], // Mock embeddings
          [0.4, 0.5, 0.6]
        ]),
        embedQuery: jest.fn().mockResolvedValue([0.7, 0.8, 0.9])
      };
    })
  };
});

describe('Embedding Service', () => {
  // Mock console logging to avoid cluttering test output
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an instance with the correct configuration', () => {
    const embeddingService = new EmbeddingService();
    expect(embeddingService).toBeDefined();
    
    // Verify OpenAIEmbeddings was called with the correct parameters
    expect(OpenAIEmbeddings).toHaveBeenCalledWith({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: expect.any(String)
    });
  });

  it('should generate embeddings for documents', async () => {
    const embeddingService = new EmbeddingService();
    
    // Create test documents
    const documents = [
      new LangChainDocument({
        pageContent: 'This is the first test document.',
        metadata: { source: 'test-source-1' }
      }),
      new LangChainDocument({
        pageContent: 'This is the second test document.',
        metadata: { source: 'test-source-2' }
      })
    ];
    
    // Generate embeddings
    const results = await embeddingService.embedDocuments(documents);
    
    // Verify results
    expect(results).toHaveLength(2);
    expect(results[0].embedding).toEqual([0.1, 0.2, 0.3]);
    expect(results[1].embedding).toEqual([0.4, 0.5, 0.6]);
    
    // Verify metadata was preserved and enhanced
    expect(results[0].document.metadata).toHaveProperty('source', 'test-source-1');
    expect(results[0].document.metadata).toHaveProperty('embedding_model');
    expect(results[0].document.metadata).toHaveProperty('embedding_timestamp');
  });
  
  it('should generate embedding for a query', async () => {
    const embeddingService = new EmbeddingService();
    
    // Generate embedding for a query
    const embedding = await embeddingService.embedQuery('Test query');
    
    // Verify the embedding
    expect(embedding).toEqual([0.7, 0.8, 0.9]);
  });
  
  it('should handle processing documents in batches', async () => {
    const embeddingService = new EmbeddingService();
    
    // Create a large number of documents to force batching
    const documents = Array(25).fill(null).map((_, i) => {
      return new LangChainDocument({
        pageContent: `Document ${i}`,
        metadata: { source: `test-source-${i}` }
      });
    });
    
    // Generate embeddings
    const results = await embeddingService.embedDocuments(documents);
    
    // Should still get results for all documents
    expect(results).toHaveLength(25);
  });
}); 