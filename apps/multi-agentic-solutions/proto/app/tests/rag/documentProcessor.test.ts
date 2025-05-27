import { expect, describe, it } from '@jest/globals';
import { Document } from '../../src/types/index.js';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { processDocuments } from '../../src/rag/documentProcessor.js';

describe('Document Processor', () => {
  it('should split documents into chunks', async () => {
    // Prepare test documents
    const documents: Document[] = [
      {
        id: '1',
        content: 'This is a test document with enough content to be split into multiple chunks. '.repeat(10),
        metadata: { source: 'test' }
      }
    ];

    // Process documents with small chunk size to ensure splitting
    const result = await processDocuments(documents, { 
      chunkSize: 100,
      chunkOverlap: 20
    });

    // Verify results
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(1); // Should split into multiple chunks
    expect(result[0].pageContent).toBeDefined();
    expect(result[0].metadata).toHaveProperty('documentId', '1');
    expect(result[0].metadata).toHaveProperty('source', 'test');
  });

  it('should maintain document metadata', async () => {
    // Prepare test documents with rich metadata
    const documents: Document[] = [
      {
        id: '2',
        content: 'Short test content',
        metadata: { 
          source: 'test',
          author: 'Jest',
          createdAt: new Date('2023-01-01'),
          tags: ['test', 'document']
        }
      }
    ];

    // Process documents
    const result = await processDocuments(documents);

    // Verify metadata is preserved
    expect(result[0].metadata).toHaveProperty('source', 'test');
    expect(result[0].metadata).toHaveProperty('author', 'Jest');
    expect(result[0].metadata).toHaveProperty('tags');
    expect(Array.isArray(result[0].metadata.tags)).toBe(true);
    expect(result[0].metadata.tags).toContain('test');
  });

  it('should add additional metadata when provided', async () => {
    // Prepare test documents
    const documents: Document[] = [
      {
        id: '3',
        content: 'Another test document',
        metadata: { source: 'test' }
      }
    ];

    // Additional metadata to be added
    const additionalMetadata = {
      processingDate: '2023-05-27',
      processor: 'jest-test'
    };

    // Process with additional metadata
    const result = await processDocuments(documents, {
      metadata: additionalMetadata
    });

    // Verify additional metadata is added
    expect(result[0].metadata).toHaveProperty('processingDate', '2023-05-27');
    expect(result[0].metadata).toHaveProperty('processor', 'jest-test');
    expect(result[0].metadata).toHaveProperty('source', 'test'); // Original metadata still present
  });
}); 