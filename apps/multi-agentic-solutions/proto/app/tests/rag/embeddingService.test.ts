import { expect, describe, it, jest, beforeEach } from '@jest/globals';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { createMockEmbedding } from '../mocks.js';
import { EmbeddingService } from '../../src/rag/embeddingService.js';
import { DocumentWithEmbedding } from '../../src/rag/embeddingService.js';

// Mock the OpenAI embeddings class that EmbeddingService uses internally
jest.mock('@langchain/openai', () => {
  return {
    OpenAIEmbeddings: jest.fn().mockImplementation(() => {
      return {
        embedDocuments: jest.fn().mockImplementation(async (texts: string[]) => {
          return texts.map(() => createMockEmbedding(3072));
        }),
        embedQuery: jest.fn().mockImplementation(async () => {
          return createMockEmbedding(3072);
        })
      };
    })
  };
});

describe('Embedding Service', () => {
  let embeddingService: EmbeddingService;
  let testDocuments: LangChainDocument[];

  beforeEach(() => {
    embeddingService = new EmbeddingService();

    // Create test documents
    testDocuments = [
      new LangChainDocument({
        pageContent: 'This is the first test document',
        metadata: { id: '1', source: 'test' }
      }),
      new LangChainDocument({
        pageContent: 'This is the second test document',
        metadata: { id: '2', source: 'test' }
      })
    ];
  });

  it('should generate embeddings for documents', async () => {
    const result = await embeddingService.embedDocuments(testDocuments);

    // Verify results
    expect(result.length).toBe(2);
    expect(result[0].document).toBeDefined();
    expect(result[0].embedding).toBeDefined();
    expect(result[0].embedding.length).toBe(3072);
    expect(result[0].document.metadata).toHaveProperty('id', '1');
    expect(result[0].document.metadata).toHaveProperty('source', 'test');
  });

  it('should generate embeddings for queries', async () => {
    const query = 'This is a test query';
    const result = await embeddingService.embedQuery(query);

    // Verify results
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3072);
  });

  it('should handle batching correctly', async () => {
    // Create a larger set of documents to test batching
    const manyDocuments = Array(25).fill(null).map((_, index) => 
      new LangChainDocument({
        pageContent: `Test document ${index}`,
        metadata: { id: `${index}`, source: 'test' }
      })
    );

    const result = await embeddingService.embedDocuments(manyDocuments);

    // Verify all documents were processed
    expect(result.length).toBe(25);
    expect(result[24].document.pageContent).toBe('Test document 24');
  }, 10000); // Increase timeout for this test
}); 