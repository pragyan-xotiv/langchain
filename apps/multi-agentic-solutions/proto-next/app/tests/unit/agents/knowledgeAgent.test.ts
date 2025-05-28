import { KnowledgeAgent } from '@/lib/agents/knowledgeAgent';
import { Document as LangChainDocument } from '@langchain/core/documents';

// Import the mocked modules directly to access mock functions and constructors
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { VectorStoreService } from '@/lib/rag/vectorStore';

// Mock the direct dependencies instead of the imported classes
const mockPipe = jest.fn().mockReturnThis();
const mockInvoke = jest.fn().mockResolvedValue('Mocked answer with citation [Doc 1]');
const mockSimilaritySearch = jest.fn().mockResolvedValue([
  new LangChainDocument({
    pageContent: 'This is a test document with relevant content.',
    metadata: { source: 'test-doc-1.pdf', page: 1 }
  }),
  new LangChainDocument({
    pageContent: 'This is another test document with relevant content.',
    metadata: { source: 'test-doc-2.pdf', page: 2 }
  })
]);

// Separate mock for empty results
const mockEmptySimilaritySearch = jest.fn().mockResolvedValue([]);
// Separate mock for error
const mockErrorSimilaritySearch = jest.fn().mockRejectedValue(new Error('Test error'));

// Mock dependencies
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    pipe: mockPipe
  }))
}));

jest.mock('@langchain/core/output_parsers', () => ({
  StringOutputParser: jest.fn().mockImplementation(() => ({
    pipe: mockPipe,
    invoke: mockInvoke
  }))
}));

jest.mock('@/lib/rag/vectorStore', () => ({
  VectorStoreService: jest.fn().mockImplementation(() => ({
    similaritySearch: mockSimilaritySearch
  }))
}));

jest.mock('@/lib/rag/embeddingService', () => ({
  EmbeddingService: jest.fn()
}));

// Use a class to mock context building logic with controlled access to private methods
class TestableKnowledgeAgent extends KnowledgeAgent {
  public exposedBuildContext(docs: LangChainDocument[]): string {
    return this['buildContext'](docs);
  }
}

describe('Knowledge Agent', () => {
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
    const agent = new KnowledgeAgent();
    expect(agent).toBeDefined();
    
    // Verify dependencies were created
    expect(ChatOpenAI).toHaveBeenCalled();
    expect(VectorStoreService).toHaveBeenCalled();
    expect(StringOutputParser).toHaveBeenCalled();
  });

  it('should query the knowledge base and return an answer', async () => {
    const agent = new KnowledgeAgent();
    
    // Query the knowledge base
    const answer = await agent.query('What is LangChain?');
    
    // Verify vector store was queried
    expect(mockSimilaritySearch).toHaveBeenCalledWith('What is LangChain?', 5);
    
    // Verify answer is returned
    expect(answer).toEqual('Mocked answer with citation [Doc 1]');
  });

  it('should return a fallback response when no documents are found', async () => {
    // Override similarity search to return empty array
    (VectorStoreService as jest.Mock).mockImplementationOnce(() => ({
      similaritySearch: mockEmptySimilaritySearch
    }));
    
    const agent = new KnowledgeAgent();
    
    // Query the knowledge base
    const answer = await agent.query('Unknown query');
    
    // Verify the fallback message is returned
    expect(answer).toContain("I don't have enough information");
  });

  it('should build context from documents with citation markers', async () => {
    const agent = new TestableKnowledgeAgent();
    
    // Mock documents
    const docs = [
      new LangChainDocument({
        pageContent: 'LangChain is a framework for developing applications powered by language models.',
        metadata: { source: 'langchain-docs.pdf', page: 1 }
      }),
      new LangChainDocument({
        pageContent: 'LangChain helps you build LLM-powered applications.',
        metadata: { source: 'langchain-guide.pdf', page: 5 }
      })
    ];
    
    // Use our testable method to access the private method
    const context = agent.exposedBuildContext(docs);
    
    // Verify context format
    expect(context).toContain('[Doc 1] (Source: langchain-docs.pdf)');
    expect(context).toContain('[Doc 2] (Source: langchain-guide.pdf)');
    expect(context).toContain('LangChain is a framework');
    expect(context).toContain('LangChain helps you build');
  });

  it('should handle errors gracefully', async () => {
    // Override similarity search to throw an error
    (VectorStoreService as jest.Mock).mockImplementationOnce(() => ({
      similaritySearch: mockErrorSimilaritySearch
    }));
    
    const agent = new KnowledgeAgent();
    
    // Expect the query to throw an error
    await expect(agent.query('Error query')).rejects.toThrow('Failed to process knowledge query');
  });
}); 