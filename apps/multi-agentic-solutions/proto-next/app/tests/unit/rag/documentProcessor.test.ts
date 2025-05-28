import { processDocuments } from '@/lib/rag/documentProcessor';
import { Document } from '@/types';

describe('Document Processor', () => {
  // Mock console logging to avoid cluttering test output
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should process documents into chunks', async () => {
    // Create test documents
    const documents: Document[] = [
      {
        id: 'doc-1',
        content: 'This is the first test document. It contains some text that will be processed.',
        metadata: { source: 'test-source-1' }
      },
      {
        id: 'doc-2',
        content: 'This is the second test document. It also contains text that will be processed.',
        metadata: { source: 'test-source-2' }
      }
    ];

    // Process documents with default options
    const chunks = await processDocuments(documents);

    // Verify the chunks
    expect(chunks).toBeDefined();
    expect(chunks.length).toBeGreaterThanOrEqual(2); // At least one chunk per document
    
    // Verify the first chunk
    expect(chunks[0].pageContent).toContain('This is the first test document');
    expect(chunks[0].metadata).toHaveProperty('documentId', 'doc-1');
    expect(chunks[0].metadata).toHaveProperty('source', 'test-source-1');
  });

  it('should process documents with custom chunk size and overlap', async () => {
    // Create a larger test document
    const documents: Document[] = [
      {
        id: 'doc-3',
        content: 'A '.repeat(1000), // Create a long document with 2000 characters
        metadata: { source: 'test-source-3' }
      }
    ];

    // Process with small chunk size to force multiple chunks
    const chunks = await processDocuments(documents, {
      chunkSize: 100, // Small chunk size
      chunkOverlap: 10 // Small overlap
    });

    // Verify multiple chunks were created
    expect(chunks.length).toBeGreaterThan(1);
    
    // All chunks should have the same document ID
    chunks.forEach(chunk => {
      expect(chunk.metadata).toHaveProperty('documentId', 'doc-3');
    });
  });

  it('should add custom metadata to all chunks', async () => {
    const documents: Document[] = [
      {
        id: 'doc-4',
        content: 'Test document with custom metadata.',
        metadata: { source: 'test-source-4' }
      }
    ];

    // Add custom metadata
    const customMetadata = {
      category: 'test',
      importance: 'high',
      processed_date: new Date().toISOString()
    };

    const chunks = await processDocuments(documents, {
      metadata: customMetadata
    });

    // Verify custom metadata was added
    expect(chunks[0].metadata).toHaveProperty('category', 'test');
    expect(chunks[0].metadata).toHaveProperty('importance', 'high');
    expect(chunks[0].metadata).toHaveProperty('processed_date');
    
    // Original metadata should be preserved
    expect(chunks[0].metadata).toHaveProperty('source', 'test-source-4');
  });

  it('should handle error gracefully', async () => {
    // Create an invalid document to force an error
    const invalidDocuments = null as unknown as Document[];

    // Expect the function to throw an error
    await expect(processDocuments(invalidDocuments)).rejects.toThrow();
  });
}); 