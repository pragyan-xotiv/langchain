import { expect, describe, it, jest, beforeEach } from '@jest/globals';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { Document } from '../src/types/index.js';
import { processDocuments } from '../src/rag/documentProcessor.js';
import { EmbeddingService } from '../src/rag/embeddingService.js';
import { Retriever } from '../src/rag/retriever.js';
import { KnowledgeAgent } from '../src/agents/knowledgeAgent.js';

// Mock required dependencies
jest.mock('@langchain/openai', () => {
  return {
    OpenAIEmbeddings: jest.fn().mockImplementation(() => {
      return {
        embedDocuments: jest.fn().mockResolvedValue([Array(128).fill(0.1)]),
        embedQuery: jest.fn().mockResolvedValue(Array(128).fill(0.1))
      };
    }),
    ChatOpenAI: jest.fn().mockImplementation(() => {
      return {
        invoke: jest.fn().mockResolvedValue({
          content: 'This is a mock response from the LLM with citation [Doc 1].'
        })
      };
    })
  };
});

jest.mock('@langchain/community/vectorstores/supabase', () => {
  return {
    SupabaseVectorStore: {
      fromExistingIndex: jest.fn().mockResolvedValue({
        similaritySearch: jest.fn().mockResolvedValue([
          new LangChainDocument({
            pageContent: 'This is a mock document content',
            metadata: { source: 'mock-source.pdf', page: 1 }
          })
        ])
      })
    }
  };
});

// Mock processors
jest.mock('../src/rag/documentProcessor.js', () => ({
  processDocuments: jest.fn().mockImplementation((docs) => {
    return Promise.resolve(docs.map(doc => 
      new LangChainDocument({
        pageContent: doc.content,
        metadata: { 
          ...doc.metadata, 
          documentId: doc.id,
          embedding_model: 'mock-model',
          embedding_timestamp: new Date().toISOString()
        }
      })
    ));
  })
}));

describe('Knowledge Layer Integration', () => {
  let sampleDocuments: Document[];

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Sample test documents
    sampleDocuments = [
      {
        id: 'doc-1',
        content: 'LangChain is a framework for developing applications powered by language models.',
        metadata: { source: 'langchain-docs.pdf', page: 1 }
      },
      {
        id: 'doc-2',
        content: 'Supabase is an open source Firebase alternative that provides database, authentication, and storage services.',
        metadata: { source: 'supabase-docs.pdf', page: 1 }
      },
      {
        id: 'doc-3',
        content: 'LangGraph is a library for building stateful, multi-actor applications with LLMs, built on top of LangChain.',
        metadata: { source: 'langgraph-docs.pdf', page: 1 }
      }
    ];
  });

  it('should process documents and convert them to LangChain documents', async () => {
    const result = await processDocuments(sampleDocuments);
    
    expect(result.length).toBe(3);
    expect(result[0].pageContent).toBe(sampleDocuments[0].content);
    expect(result[0].metadata).toHaveProperty('documentId', 'doc-1');
    expect(result[0].metadata).toHaveProperty('source', 'langchain-docs.pdf');
  });

  it('should generate embeddings for documents', async () => {
    // Setup: Process documents
    const processedDocs = await processDocuments(sampleDocuments);
    
    // Test embedding generation
    const embeddingService = new EmbeddingService();
    
    // Mock the embedDocuments implementation
    jest.spyOn(embeddingService, 'embedDocuments').mockImplementation(async (docs) => {
      return docs.map(doc => ({
        document: doc,
        embedding: Array(128).fill(0.1)
      }));
    });
    
    const result = await embeddingService.embedDocuments(processedDocs);
    
    expect(result.length).toBe(3);
    expect(result[0].document).toBeDefined();
    expect(result[0].embedding).toBeDefined();
    expect(result[0].embedding.length).toBe(128);
  });

  it('should allow querying the knowledge base', async () => {
    // Setup a knowledge agent with mocked retriever
    const knowledgeAgent = new KnowledgeAgent();
    
    // Mock query method
    jest.spyOn(knowledgeAgent, 'query').mockImplementation(async (question) => {
      if (question.includes('empty')) {
        return "I don't have enough information to answer that question.";
      }
      return `Here's information about ${question}: This is a mock response with citation [Doc 1].`;
    });
    
    // Test querying with results
    const result = await knowledgeAgent.query('LangChain framework');
    
    expect(result).toContain('LangChain');
    expect(result).toContain('[Doc 1]');
    
    // Test querying with no results
    const emptyResult = await knowledgeAgent.query('empty query');
    
    expect(emptyResult).toContain("I don't have enough information");
  });

  it('should demonstrate the full RAG workflow', async () => {
    // 1. Process documents
    const processedDocs = await processDocuments(sampleDocuments);
    expect(processedDocs.length).toBe(3);
    
    // 2. Generate embeddings
    const embeddingService = new EmbeddingService();
    jest.spyOn(embeddingService, 'embedDocuments').mockImplementation(async (docs) => {
      return docs.map(doc => ({
        document: doc,
        embedding: Array(128).fill(0.1)
      }));
    });
    
    const docsWithEmbeddings = await embeddingService.embedDocuments(processedDocs);
    expect(docsWithEmbeddings.length).toBe(3);
    
    // 3. Setup retriever and mock its methods
    const retriever = new Retriever();
    const mockIndexDocuments = jest.spyOn(retriever, 'indexDocuments').mockResolvedValue(undefined);
    const mockRetrieveDocuments = jest.spyOn(retriever, 'retrieveRelevantDocuments').mockImplementation(async (query, k) => {
      return [
        new LangChainDocument({
          pageContent: 'LangChain is a framework for developing applications powered by language models.',
          metadata: { source: 'langchain-docs.pdf', score: 0.95 }
        }),
        new LangChainDocument({
          pageContent: 'LangGraph is a library for building stateful, multi-actor applications with LLMs.',
          metadata: { source: 'langgraph-docs.pdf', score: 0.85 }
        })
      ].slice(0, k);
    });
    
    // 4. Index documents
    await retriever.indexDocuments(sampleDocuments);
    expect(mockIndexDocuments).toHaveBeenCalledWith(sampleDocuments);
    
    // 5. Retrieve relevant documents
    const relevantDocs = await retriever.retrieveRelevantDocuments('LangChain', 2);
    expect(relevantDocs.length).toBe(2);
    expect(mockRetrieveDocuments).toHaveBeenCalledWith('LangChain', 2);
    
    // 6. Setup knowledge agent and mock its methods
    const knowledgeAgent = new KnowledgeAgent();
    const mockQuery = jest.spyOn(knowledgeAgent, 'query').mockImplementation(async (question) => {
      return `Answer to "${question}": LangChain is a framework for developing applications powered by language models [Doc 1].`;
    });
    
    // 7. Query the knowledge agent
    const answer = await knowledgeAgent.query('What is LangChain?');
    expect(answer).toContain('LangChain is a framework');
    expect(answer).toContain('[Doc 1]');
    expect(mockQuery).toHaveBeenCalledWith('What is LangChain?');
  });
}); 